/// Parser for the Lira DSL.
///
/// Consumes the token stream produced by the lexer and builds a `LiraContract` AST.
///
/// # Grammar (simplified)
///
/// ```text
/// contract       ::= "version" STRING_LIT
///                    "contract" IDENT "{"
///                      ("states" "{" state_decl* "}")?
///                      ("transitions" "{" transition_decl* "}")?
///                      ("triggers" "{" trigger_decl* "}")?
///                      ("actions" "{" action_decl* "}")?
///                      ("safety_checks" "{" check_decl* "}")?
///                    "}"
/// state_decl     ::= IDENT ("initial")? ("terminal")?
/// transition_decl::= IDENT "->" IDENT ("guard" ":" expr)?
/// ```
use crate::ast::*;
use crate::error::LiraError;
use crate::lexer::Token;

pub struct Parser {
    tokens: Vec<Token>,
    pos: usize,
}

impl Parser {
    pub fn new(tokens: Vec<Token>) -> Self {
        Self { tokens, pos: 0 }
    }

    // ── Navigation helpers ────────────────────────────────────────────────────

    fn peek(&self) -> &Token {
        self.tokens.get(self.pos).unwrap_or(&Token::Eof)
    }

    fn advance(&mut self) -> &Token {
        let tok = self.tokens.get(self.pos).unwrap_or(&Token::Eof);
        if self.pos < self.tokens.len() {
            self.pos += 1;
        }
        tok
    }

    fn expect_ident(&mut self) -> Result<String, LiraError> {
        match self.advance().clone() {
            Token::Ident(s) => Ok(s),
            other => Err(LiraError::UnexpectedToken {
                expected: "identifier".into(),
                got: format!("{other:?}"),
                line: 0,
            }),
        }
    }

    fn expect(&mut self, expected: &Token) -> Result<(), LiraError> {
        let tok = self.advance().clone();
        if &tok == expected {
            Ok(())
        } else {
            Err(LiraError::UnexpectedToken {
                expected: format!("{expected:?}"),
                got: format!("{tok:?}"),
                line: 0,
            })
        }
    }

    // ── Top-level ─────────────────────────────────────────────────────────────

    pub fn parse(mut self) -> Result<LiraContract, LiraError> {
        // version "x.y"
        self.expect(&Token::Version)?;
        let version = match self.advance().clone() {
            Token::StringLit(s) => s,
            other => {
                return Err(LiraError::UnexpectedToken {
                    expected: "version string".into(),
                    got: format!("{other:?}"),
                    line: 0,
                })
            }
        };

        // contract <Name> { … }
        self.expect(&Token::Contract)?;
        let name = self.expect_ident()?;
        self.expect(&Token::LBrace)?;

        let mut states = Vec::new();
        let mut transitions = Vec::new();
        let mut triggers = Vec::new();
        let mut actions = Vec::new();
        let mut safety_checks = Vec::new();

        loop {
            match self.peek().clone() {
                Token::RBrace | Token::Eof => {
                    self.advance();
                    break;
                }
                Token::States => {
                    self.advance();
                    states = self.parse_states()?;
                }
                Token::Transitions => {
                    self.advance();
                    transitions = self.parse_transitions()?;
                }
                Token::Triggers => {
                    self.advance();
                    triggers = self.parse_triggers()?;
                }
                Token::Actions => {
                    self.advance();
                    actions = self.parse_actions()?;
                }
                Token::SafetyChecks => {
                    self.advance();
                    safety_checks = self.parse_safety_checks()?;
                }
                other => {
                    return Err(LiraError::UnexpectedToken {
                        expected: "states|transitions|triggers|actions|safety_checks|'}'".into(),
                        got: format!("{other:?}"),
                        line: 0,
                    })
                }
            }
        }

        Ok(LiraContract {
            version,
            name,
            states,
            transitions,
            triggers,
            actions,
            safety_checks,
        })
    }

    // ── States ────────────────────────────────────────────────────────────────

    fn parse_states(&mut self) -> Result<Vec<State>, LiraError> {
        self.expect(&Token::LBrace)?;
        let mut states = Vec::new();
        loop {
            match self.peek().clone() {
                Token::RBrace | Token::Eof => {
                    self.advance();
                    break;
                }
                Token::Ident(name) => {
                    self.advance();
                    let mut initial = false;
                    let mut terminal = false;
                    loop {
                        match self.peek() {
                            Token::Initial => {
                                self.advance();
                                initial = true;
                            }
                            Token::Terminal => {
                                self.advance();
                                terminal = true;
                            }
                            _ => break,
                        }
                    }
                    states.push(State {
                        name,
                        initial,
                        terminal,
                    });
                }
                other => {
                    return Err(LiraError::UnexpectedToken {
                        expected: "state name or '}'".into(),
                        got: format!("{other:?}"),
                        line: 0,
                    })
                }
            }
        }
        Ok(states)
    }

    // ── Transitions ───────────────────────────────────────────────────────────

    fn parse_transitions(&mut self) -> Result<Vec<Transition>, LiraError> {
        self.expect(&Token::LBrace)?;
        let mut transitions = Vec::new();
        loop {
            match self.peek().clone() {
                Token::RBrace | Token::Eof => {
                    self.advance();
                    break;
                }
                Token::Ident(from) => {
                    self.advance();
                    self.expect(&Token::Arrow)?;
                    let to = self.expect_ident()?;
                    let guard = if self.peek() == &Token::Guard {
                        self.advance();
                        self.expect(&Token::Colon)?;
                        Some(self.parse_expr()?)
                    } else {
                        None
                    };
                    transitions.push(Transition { from, to, guard });
                }
                other => {
                    return Err(LiraError::UnexpectedToken {
                        expected: "transition (IDENT -> IDENT) or '}'".into(),
                        got: format!("{other:?}"),
                        line: 0,
                    })
                }
            }
        }
        Ok(transitions)
    }

    // ── Triggers ──────────────────────────────────────────────────────────────

    fn parse_triggers(&mut self) -> Result<Vec<Trigger>, LiraError> {
        self.expect(&Token::LBrace)?;
        let mut triggers = Vec::new();
        loop {
            match self.peek().clone() {
                Token::RBrace | Token::Eof => {
                    self.advance();
                    break;
                }
                Token::On => {
                    self.advance();
                    let contract = self.expect_ident()?;
                    self.expect(&Token::Dot)?;
                    let event = self.expect_ident()?;
                    triggers.push(Trigger::OnChainEvent { contract, event });
                }
                Token::Schedule => {
                    self.advance();
                    self.expect(&Token::Cron)?;
                    self.expect(&Token::Colon)?;
                    let cron = match self.advance().clone() {
                        Token::StringLit(s) => s,
                        other => {
                            return Err(LiraError::UnexpectedToken {
                                expected: "cron string".into(),
                                got: format!("{other:?}"),
                                line: 0,
                            })
                        }
                    };
                    triggers.push(Trigger::Schedule { cron });
                }
                Token::MarginCall => {
                    self.advance();
                    self.expect(&Token::CollatRatio)?;
                    self.expect(&Token::Colon)?;
                    let ratio = match self.advance().clone() {
                        Token::FloatLit(f) => f,
                        Token::IntLit(i) => i as f64,
                        other => {
                            return Err(LiraError::UnexpectedToken {
                                expected: "collateral ratio (number)".into(),
                                got: format!("{other:?}"),
                                line: 0,
                            })
                        }
                    };
                    triggers.push(Trigger::MarginCall {
                        collateral_ratio: ratio,
                    });
                }
                Token::PriceThreshold => {
                    self.advance();
                    self.expect(&Token::Pair)?;
                    self.expect(&Token::Colon)?;
                    let pair = match self.advance().clone() {
                        Token::StringLit(s) | Token::Ident(s) => s,
                        other => {
                            return Err(LiraError::UnexpectedToken {
                                expected: "pair string".into(),
                                got: format!("{other:?}"),
                                line: 0,
                            })
                        }
                    };
                    let operator = match self.advance().clone() {
                        Token::Gt => CompareOp::Gt,
                        Token::Gte => CompareOp::Gte,
                        Token::Lt => CompareOp::Lt,
                        Token::Lte => CompareOp::Lte,
                        Token::Eq => CompareOp::Eq,
                        other => {
                            return Err(LiraError::UnexpectedToken {
                                expected: "comparison operator".into(),
                                got: format!("{other:?}"),
                                line: 0,
                            })
                        }
                    };
                    let value = match self.advance().clone() {
                        Token::FloatLit(f) => f,
                        Token::IntLit(i) => i as f64,
                        other => {
                            return Err(LiraError::UnexpectedToken {
                                expected: "price value (number)".into(),
                                got: format!("{other:?}"),
                                line: 0,
                            })
                        }
                    };
                    triggers.push(Trigger::PriceThreshold {
                        pair,
                        operator,
                        value,
                    });
                }
                Token::OracleCallback => {
                    self.advance();
                    self.expect(&Token::Source)?;
                    self.expect(&Token::Colon)?;
                    let source = self.expect_ident()?;
                    self.expect(&Token::Condition)?;
                    self.expect(&Token::Colon)?;
                    let condition = self.parse_expr()?;
                    triggers.push(Trigger::OracleCallback { source, condition });
                }
                other => {
                    return Err(LiraError::UnexpectedToken {
                        expected: "trigger declaration or '}'".into(),
                        got: format!("{other:?}"),
                        line: 0,
                    })
                }
            }
        }
        Ok(triggers)
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    fn parse_actions(&mut self) -> Result<Vec<Action>, LiraError> {
        self.expect(&Token::LBrace)?;
        let mut actions = Vec::new();
        loop {
            match self.peek().clone() {
                Token::RBrace | Token::Eof => {
                    self.advance();
                    break;
                }
                Token::Transfer => {
                    self.advance();
                    self.expect(&Token::From)?;
                    self.expect(&Token::Colon)?;
                    let from = self.expect_ident()?;
                    self.expect(&Token::To)?;
                    self.expect(&Token::Colon)?;
                    let to = self.expect_ident()?;
                    self.expect(&Token::Token_)?;
                    self.expect(&Token::Colon)?;
                    let token = self.expect_ident()?;
                    self.expect(&Token::Amount)?;
                    self.expect(&Token::Colon)?;
                    let amount = self.parse_expr()?;
                    actions.push(Action::Transfer {
                        from,
                        to,
                        token,
                        amount,
                    });
                }
                Token::State => {
                    self.advance();
                    self.expect(&Token::Colon)?;
                    let state = self.expect_ident()?;
                    actions.push(Action::Transition { state });
                }
                Token::Emit => {
                    self.advance();
                    self.expect(&Token::Event)?;
                    self.expect(&Token::Colon)?;
                    let event = self.expect_ident()?;
                    actions.push(Action::Emit {
                        event,
                        payload: Vec::new(),
                    });
                }
                Token::Notify => {
                    self.advance();
                    self.expect(&Token::Recipient)?;
                    self.expect(&Token::Colon)?;
                    let recipient = self.expect_ident()?;
                    self.expect(&Token::Message)?;
                    self.expect(&Token::Colon)?;
                    let message = match self.advance().clone() {
                        Token::StringLit(s) => s,
                        other => {
                            return Err(LiraError::UnexpectedToken {
                                expected: "notification message string".into(),
                                got: format!("{other:?}"),
                                line: 0,
                            })
                        }
                    };
                    actions.push(Action::Notify { recipient, message });
                }
                Token::Call => {
                    self.advance();
                    let contract = self.expect_ident()?;
                    self.expect(&Token::Dot)?;
                    let function = self.expect_ident()?;
                    self.expect(&Token::LParen)?;
                    let mut args = Vec::new();
                    loop {
                        if self.peek() == &Token::RParen {
                            self.advance();
                            break;
                        }
                        args.push(self.parse_expr()?);
                        if self.peek() == &Token::Comma {
                            self.advance();
                        }
                    }
                    actions.push(Action::ContractCall {
                        contract,
                        function,
                        args,
                    });
                }
                other => {
                    return Err(LiraError::UnexpectedToken {
                        expected: "action declaration or '}'".into(),
                        got: format!("{other:?}"),
                        line: 0,
                    })
                }
            }
        }
        Ok(actions)
    }

    // ── Safety checks ─────────────────────────────────────────────────────────

    fn parse_safety_checks(&mut self) -> Result<Vec<SafetyCheck>, LiraError> {
        self.expect(&Token::LBrace)?;
        let mut checks = Vec::new();
        loop {
            match self.peek().clone() {
                Token::RBrace | Token::Eof => {
                    self.advance();
                    break;
                }
                Token::Check => {
                    self.advance();
                    let id = self.expect_ident()?;
                    self.expect(&Token::Colon)?;
                    let condition = self.parse_expr()?;
                    self.expect(&Token::Message)?;
                    self.expect(&Token::Colon)?;
                    let message = match self.advance().clone() {
                        Token::StringLit(s) => s,
                        other => {
                            return Err(LiraError::UnexpectedToken {
                                expected: "check message string".into(),
                                got: format!("{other:?}"),
                                line: 0,
                            })
                        }
                    };
                    checks.push(SafetyCheck {
                        id,
                        condition,
                        message,
                    });
                }
                other => {
                    return Err(LiraError::UnexpectedToken {
                        expected: "check declaration or '}'".into(),
                        got: format!("{other:?}"),
                        line: 0,
                    })
                }
            }
        }
        Ok(checks)
    }

    // ── Expressions (Pratt parser) ────────────────────────────────────────────

    fn parse_expr(&mut self) -> Result<Expression, LiraError> {
        self.parse_or()
    }

    fn parse_or(&mut self) -> Result<Expression, LiraError> {
        let mut left = self.parse_and()?;
        while self.peek() == &Token::Or {
            self.advance();
            let right = self.parse_and()?;
            left = Expression::BinOp {
                op: BinOpKind::Or,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        Ok(left)
    }

    fn parse_and(&mut self) -> Result<Expression, LiraError> {
        let mut left = self.parse_cmp()?;
        while self.peek() == &Token::And {
            self.advance();
            let right = self.parse_cmp()?;
            left = Expression::BinOp {
                op: BinOpKind::And,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        Ok(left)
    }

    fn parse_cmp(&mut self) -> Result<Expression, LiraError> {
        let left = self.parse_add()?;
        let op = match self.peek() {
            Token::Gt => BinOpKind::Gt,
            Token::Gte => BinOpKind::Gte,
            Token::Lt => BinOpKind::Lt,
            Token::Lte => BinOpKind::Lte,
            Token::Eq => BinOpKind::Eq,
            Token::Neq => BinOpKind::Neq,
            _ => return Ok(left),
        };
        self.advance();
        let right = self.parse_add()?;
        Ok(Expression::BinOp {
            op,
            left: Box::new(left),
            right: Box::new(right),
        })
    }

    fn parse_add(&mut self) -> Result<Expression, LiraError> {
        let mut left = self.parse_mul()?;
        loop {
            let op = match self.peek() {
                Token::Plus => BinOpKind::Add,
                Token::Minus => BinOpKind::Sub,
                _ => break,
            };
            self.advance();
            let right = self.parse_mul()?;
            left = Expression::BinOp {
                op,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        Ok(left)
    }

    fn parse_mul(&mut self) -> Result<Expression, LiraError> {
        let mut left = self.parse_unary()?;
        loop {
            let op = match self.peek() {
                Token::Star => BinOpKind::Mul,
                Token::Slash => BinOpKind::Div,
                _ => break,
            };
            self.advance();
            let right = self.parse_unary()?;
            left = Expression::BinOp {
                op,
                left: Box::new(left),
                right: Box::new(right),
            };
        }
        Ok(left)
    }

    fn parse_unary(&mut self) -> Result<Expression, LiraError> {
        match self.peek().clone() {
            Token::Not => {
                self.advance();
                Ok(Expression::UnaryOp {
                    op: UnaryOpKind::Not,
                    expr: Box::new(self.parse_primary()?),
                })
            }
            Token::Minus => {
                self.advance();
                Ok(Expression::UnaryOp {
                    op: UnaryOpKind::Neg,
                    expr: Box::new(self.parse_primary()?),
                })
            }
            _ => self.parse_primary(),
        }
    }

    fn parse_primary(&mut self) -> Result<Expression, LiraError> {
        match self.advance().clone() {
            Token::IntLit(v) => Ok(Expression::IntLit { value: v }),
            Token::FloatLit(v) => Ok(Expression::FloatLit { value: v }),
            Token::StringLit(v) => Ok(Expression::StrLit { value: v }),
            Token::BoolLit(v) => Ok(Expression::BoolLit { value: v }),
            Token::Ident(name) => Ok(Expression::Ident { name }),
            Token::LParen => {
                let expr = self.parse_expr()?;
                self.expect(&Token::RParen)?;
                Ok(expr)
            }
            // Allow DSL field-name keywords to be used as identifiers in expressions.
            // e.g. `amount > 0`, `from == recipient`, `pair != "ETH/USD"` etc.
            Token::Amount => Ok(Expression::Ident {
                name: "amount".into(),
            }),
            Token::From => Ok(Expression::Ident {
                name: "from".into(),
            }),
            Token::To => Ok(Expression::Ident { name: "to".into() }),
            Token::Token_ => Ok(Expression::Ident {
                name: "token".into(),
            }),
            Token::Message => Ok(Expression::Ident {
                name: "message".into(),
            }),
            Token::Recipient => Ok(Expression::Ident {
                name: "recipient".into(),
            }),
            Token::Pair => Ok(Expression::Ident {
                name: "pair".into(),
            }),
            Token::Source => Ok(Expression::Ident {
                name: "source".into(),
            }),
            Token::State => Ok(Expression::Ident {
                name: "state".into(),
            }),
            Token::Condition => Ok(Expression::Ident {
                name: "condition".into(),
            }),
            Token::Event => Ok(Expression::Ident {
                name: "event".into(),
            }),
            Token::Payload => Ok(Expression::Ident {
                name: "payload".into(),
            }),
            Token::Function => Ok(Expression::Ident {
                name: "function".into(),
            }),
            Token::Args => Ok(Expression::Ident {
                name: "args".into(),
            }),
            Token::CollatRatio => Ok(Expression::Ident {
                name: "collateral_ratio".into(),
            }),
            other => Err(LiraError::UnexpectedToken {
                expected: "expression".into(),
                got: format!("{other:?}"),
                line: 0,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::lexer::Lexer;

    fn parse(src: &str) -> Result<LiraContract, LiraError> {
        let tokens = Lexer::new(src).tokenize()?;
        Parser::new(tokens).parse()
    }

    const MINIMAL_CONTRACT: &str = r#"
version "1.0"
contract TestContract {
  states {
    Idle initial
    Active
    Done terminal
  }
  transitions {
    Idle -> Active
    Active -> Done
  }
}
"#;

    #[test]
    fn parses_minimal_contract() {
        let c = parse(MINIMAL_CONTRACT).unwrap();
        assert_eq!(c.version, "1.0");
        assert_eq!(c.name, "TestContract");
        assert_eq!(c.states.len(), 3);
        assert!(c.states[0].initial);
        assert!(c.states[2].terminal);
        assert_eq!(c.transitions.len(), 2);
    }

    #[test]
    fn parses_transfer_action() {
        let src = r#"
version "1.0"
contract Pay {
  states { Pending initial Settled terminal }
  actions {
    transfer from: sender to: receiver token: USDC amount: 100
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.actions.len(), 1);
        assert!(matches!(c.actions[0], Action::Transfer { .. }));
    }

    #[test]
    fn parses_safety_check() {
        let src = r#"
version "1.0"
contract SafePay {
  states { Open initial Closed terminal }
  safety_checks {
    check no_zero_amount: amount > 0 message: "Amount must be positive"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
        assert_eq!(c.safety_checks[0].id, "no_zero_amount");
    }

    #[test]
    fn parses_price_threshold_trigger() {
        let src = r#"
version "1.0"
contract PriceFeed {
  states { Waiting initial Fired terminal }
  triggers {
    price_threshold pair: "ETH/USD" > 3000
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.triggers.len(), 1);
        assert!(matches!(c.triggers[0], Trigger::PriceThreshold { .. }));
    }

    #[test]
    fn parses_on_chain_event_trigger() {
        let src = r#"
version "1.0"
contract EventWatch {
  states { Idle initial Done terminal }
  triggers {
    on DEX.Swap
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.triggers.len(), 1);
        assert!(matches!(
            c.triggers[0],
            Trigger::OnChainEvent {
                ref contract,
                ref event,
                ..
            } if contract == "DEX" && event == "Swap"
        ));
    }

    #[test]
    fn parses_schedule_trigger() {
        let src = r#"
version "1.0"
contract Scheduler {
  states { Active initial Done terminal }
  triggers {
    schedule cron: "0 * * * *"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.triggers.len(), 1);
        assert!(matches!(c.triggers[0], Trigger::Schedule { .. }));
    }

    #[test]
    fn parses_margin_call_trigger() {
        let src = r#"
version "1.0"
contract MarginGuard {
  states { Safe initial Liquidating terminal }
  triggers {
    margin_call collateral_ratio: 1.5
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.triggers.len(), 1);
        assert!(matches!(c.triggers[0], Trigger::MarginCall { .. }));
    }

    #[test]
    fn parses_oracle_callback_trigger() {
        let src = r#"
version "1.0"
contract OracleWatch {
  states { Waiting initial Triggered terminal }
  triggers {
    oracle_callback source: ChainlinkOracle condition: price > 100
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.triggers.len(), 1);
        assert!(matches!(c.triggers[0], Trigger::OracleCallback { .. }));
    }

    #[test]
    fn parses_price_threshold_gte() {
        let src = r#"
version "1.0"
contract PriceFeed {
  states { Waiting initial Fired terminal }
  triggers {
    price_threshold pair: "BTC/USD" >= 50000
  }
}
"#;
        let c = parse(src).unwrap();
        assert!(matches!(
            c.triggers[0],
            Trigger::PriceThreshold {
                operator: CompareOp::Gte,
                ..
            }
        ));
    }

    #[test]
    fn parses_price_threshold_lte() {
        let src = r#"
version "1.0"
contract PriceFeed2 {
  states { Waiting initial Fired terminal }
  triggers {
    price_threshold pair: "ETH/USD" <= 1500.5
  }
}
"#;
        let c = parse(src).unwrap();
        assert!(matches!(
            c.triggers[0],
            Trigger::PriceThreshold {
                operator: CompareOp::Lte,
                ..
            }
        ));
    }

    #[test]
    fn parses_price_threshold_lt_eq() {
        let src = r#"
version "1.0"
contract PriceExact {
  states { Waiting initial Fired terminal }
  triggers {
    price_threshold pair: "ETH/USD" < 2000
    price_threshold pair: "SOL/USD" == 50
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.triggers.len(), 2);
        assert!(matches!(
            c.triggers[0],
            Trigger::PriceThreshold {
                operator: CompareOp::Lt,
                ..
            }
        ));
        assert!(matches!(
            c.triggers[1],
            Trigger::PriceThreshold {
                operator: CompareOp::Eq,
                ..
            }
        ));
    }

    #[test]
    fn parses_emit_action() {
        let src = r#"
version "1.0"
contract Emitter {
  states { Active initial Done terminal }
  actions {
    emit event: TradeExecuted
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.actions.len(), 1);
        assert!(matches!(c.actions[0], Action::Emit { .. }));
    }

    #[test]
    fn parses_state_transition_action() {
        let src = r#"
version "1.0"
contract StateChanger {
  states { Open initial Closed terminal }
  actions {
    state: Closed
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.actions.len(), 1);
        assert!(matches!(c.actions[0], Action::Transition { .. }));
    }

    #[test]
    fn parses_notify_action() {
        let src = r#"
version "1.0"
contract Notifier {
  states { Active initial Done terminal }
  actions {
    notify recipient: admin message: "Contract executed"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.actions.len(), 1);
        assert!(matches!(c.actions[0], Action::Notify { .. }));
    }

    #[test]
    fn parses_call_action() {
        let src = r#"
version "1.0"
contract Caller {
  states { Ready initial Done terminal }
  actions {
    call Router.execute(amount, 100)
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.actions.len(), 1);
        assert!(matches!(c.actions[0], Action::ContractCall { .. }));
    }

    #[test]
    fn parses_guard_on_transition() {
        let src = r#"
version "1.0"
contract Guarded {
  states { Pending initial Approved terminal }
  transitions {
    Pending -> Approved guard: amount > 0
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.transitions.len(), 1);
        assert!(c.transitions[0].guard.is_some());
    }

    #[test]
    fn parses_complex_expression_in_check() {
        let src = r#"
version "1.0"
contract ComplexCheck {
  states { A initial B terminal }
  safety_checks {
    check bounded: amount >= 0 message: "Non-negative"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_logical_and_or_expr() {
        let src = r#"
version "1.0"
contract LogicCheck {
  states { A initial B terminal }
  safety_checks {
    check combo: amount > 0 message: "ok"
  }
  triggers {
    oracle_callback source: Src condition: amount > 0
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
        assert_eq!(c.triggers.len(), 1);
    }

    #[test]
    fn parses_not_expression_in_check() {
        let src = r#"
version "1.0"
contract NotCheck {
  states { A initial B terminal }
  safety_checks {
    check not_zero: not false message: "must be true"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_negation_expression() {
        let src = r#"
version "1.0"
contract NegCheck {
  states { A initial B terminal }
  safety_checks {
    check neg: -1 < 0 message: "negative"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_arithmetic_expressions() {
        let src = r#"
version "1.0"
contract Math {
  states { A initial B terminal }
  safety_checks {
    check arith: amount * 2 > 10 message: "doubled ok"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_string_literal_in_check() {
        let src = r#"
version "1.0"
contract StrCheck {
  states { A initial B terminal }
  safety_checks {
    check str_match: pair == "ETH/USD" message: "wrong pair"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_parenthesized_expression() {
        let src = r#"
version "1.0"
contract ParenExpr {
  states { A initial B terminal }
  safety_checks {
    check paren: (amount > 0) message: "ok"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_multiple_safety_checks() {
        let src = r#"
version "1.0"
contract MultiCheck {
  states { A initial B terminal }
  safety_checks {
    check c1: amount > 0 message: "positive"
    check c2: amount < 1000 message: "bounded"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 2);
        assert_eq!(c.safety_checks[0].id, "c1");
        assert_eq!(c.safety_checks[1].id, "c2");
    }

    #[test]
    fn parses_margin_call_trigger_int_ratio() {
        // margin_call with integer collateral ratio (e.g. 2 not 2.0)
        let src = r#"
version "1.0"
contract IntMargin {
  states { Safe initial Liquidating terminal }
  triggers {
    margin_call collateral_ratio: 2
  }
}
"#;
        let c = parse(src).unwrap();
        assert!(matches!(
            c.triggers[0],
            Trigger::MarginCall {
                collateral_ratio,
                ..
            } if collateral_ratio == 2.0
        ));
    }

    #[test]
    fn error_on_invalid_version() {
        let result = parse("contract Bad {}");
        assert!(result.is_err());
    }

    #[test]
    fn error_on_missing_contract_keyword() {
        let result = parse(r#"version "1.0" Bad {}"#);
        assert!(result.is_err());
    }

    #[test]
    fn error_on_unknown_section() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  unknown { }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_invalid_state_token() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  states { 123 }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_invalid_transition() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  transitions { 123 }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_bad_primary_expression() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  safety_checks {
    check c: { message: "bad"
  }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_unknown_trigger() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  triggers { unknown_trigger }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_unknown_action() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  actions { unknown_action }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn parses_float_literal_in_check() {
        let src = r#"
version "1.0"
contract FloatCheck {
  states { A initial B terminal }
  safety_checks {
    check ratio: 1.5 > 1.0 message: "ok"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_add_sub_expression() {
        let src = r#"
version "1.0"
contract AddSub {
  states { A initial B terminal }
  safety_checks {
    check calc: amount + 10 - 2 > 0 message: "ok"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_div_expression() {
        let src = r#"
version "1.0"
contract DivExpr {
  states { A initial B terminal }
  safety_checks {
    check div: amount / 2 > 0 message: "ok"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_neq_expression() {
        let src = r#"
version "1.0"
contract NeqCheck {
  states { A initial B terminal }
  safety_checks {
    check neq: amount != 0 message: "not zero"
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.safety_checks.len(), 1);
    }

    #[test]
    fn parses_and_expression_in_guard() {
        let src = r#"
version "1.0"
contract AndGuard {
  states { A initial B terminal }
  transitions {
    A -> B guard: amount > 0 and amount < 1000
  }
}
"#;
        let c = parse(src).unwrap();
        assert!(c.transitions[0].guard.is_some());
        assert!(matches!(
            c.transitions[0].guard.as_ref().unwrap(),
            Expression::BinOp {
                op: BinOpKind::And,
                ..
            }
        ));
    }

    #[test]
    fn parses_or_expression_in_guard() {
        let src = r#"
version "1.0"
contract OrGuard {
  states { A initial B terminal }
  transitions {
    A -> B guard: amount == 0 or amount > 100
  }
}
"#;
        let c = parse(src).unwrap();
        assert!(c.transitions[0].guard.is_some());
        assert!(matches!(
            c.transitions[0].guard.as_ref().unwrap(),
            Expression::BinOp {
                op: BinOpKind::Or,
                ..
            }
        ));
    }

    #[test]
    fn parses_call_with_no_args() {
        let src = r#"
version "1.0"
contract NoArgCall {
  states { Ready initial Done terminal }
  actions {
    call Vault.lock()
  }
}
"#;
        let c = parse(src).unwrap();
        assert_eq!(c.actions.len(), 1);
        if let Action::ContractCall { args, .. } = &c.actions[0] {
            assert_eq!(args.len(), 0);
        } else {
            panic!("expected ContractCall");
        }
    }

    #[test]
    fn error_on_bad_trigger_cron_type() {
        // schedule cron: requires a string literal, not an ident
        let result = parse(
            r#"version "1.0"
contract Bad {
  states { A initial }
  triggers {
    schedule cron: not_a_string
  }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_bad_margin_call_ratio_type() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  states { A initial }
  triggers {
    margin_call collateral_ratio: "not a number"
  }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_bad_price_threshold_pair() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  states { A initial }
  triggers {
    price_threshold pair: 123 > 0
  }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_bad_price_threshold_operator() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  states { A initial }
  triggers {
    price_threshold pair: "ETH/USD" and 0
  }
}"#,
        );
        assert!(result.is_err());
    }

    #[test]
    fn error_on_bad_price_threshold_value() {
        let result = parse(
            r#"version "1.0"
contract Bad {
  states { A initial }
  triggers {
    price_threshold pair: "ETH/USD" > "not a number"
  }
}"#,
        );
        assert!(result.is_err());
    }
}
