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
        if self.pos < self.tokens.len() { self.pos += 1; }
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
            other => return Err(LiraError::UnexpectedToken {
                expected: "version string".into(),
                got: format!("{other:?}"),
                line: 0,
            }),
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
                Token::RBrace | Token::Eof => { self.advance(); break; }
                Token::States       => { self.advance(); states = self.parse_states()?; }
                Token::Transitions  => { self.advance(); transitions = self.parse_transitions()?; }
                Token::Triggers     => { self.advance(); triggers = self.parse_triggers()?; }
                Token::Actions      => { self.advance(); actions = self.parse_actions()?; }
                Token::SafetyChecks => { self.advance(); safety_checks = self.parse_safety_checks()?; }
                other => return Err(LiraError::UnexpectedToken {
                    expected: "states|transitions|triggers|actions|safety_checks|'}'".into(),
                    got: format!("{other:?}"),
                    line: 0,
                }),
            }
        }

        Ok(LiraContract { version, name, states, transitions, triggers, actions, safety_checks })
    }

    // ── States ────────────────────────────────────────────────────────────────

    fn parse_states(&mut self) -> Result<Vec<State>, LiraError> {
        self.expect(&Token::LBrace)?;
        let mut states = Vec::new();
        loop {
            match self.peek().clone() {
                Token::RBrace | Token::Eof => { self.advance(); break; }
                Token::Ident(name) => {
                    self.advance();
                    let mut initial = false;
                    let mut terminal = false;
                    loop {
                        match self.peek() {
                            Token::Initial  => { self.advance(); initial = true; }
                            Token::Terminal => { self.advance(); terminal = true; }
                            _ => break,
                        }
                    }
                    states.push(State { name, initial, terminal });
                }
                other => return Err(LiraError::UnexpectedToken {
                    expected: "state name or '}'".into(),
                    got: format!("{other:?}"),
                    line: 0,
                }),
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
                Token::RBrace | Token::Eof => { self.advance(); break; }
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
                other => return Err(LiraError::UnexpectedToken {
                    expected: "transition (IDENT -> IDENT) or '}'".into(),
                    got: format!("{other:?}"),
                    line: 0,
                }),
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
                Token::RBrace | Token::Eof => { self.advance(); break; }
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
                        other => return Err(LiraError::UnexpectedToken {
                            expected: "cron string".into(), got: format!("{other:?}"), line: 0,
                        }),
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
                        other => return Err(LiraError::UnexpectedToken {
                            expected: "collateral ratio (number)".into(),
                            got: format!("{other:?}"), line: 0,
                        }),
                    };
                    triggers.push(Trigger::MarginCall { collateral_ratio: ratio });
                }
                Token::PriceThreshold => {
                    self.advance();
                    self.expect(&Token::Pair)?;
                    self.expect(&Token::Colon)?;
                    let pair = match self.advance().clone() {
                        Token::StringLit(s) | Token::Ident(s) => s,
                        other => return Err(LiraError::UnexpectedToken {
                            expected: "pair string".into(), got: format!("{other:?}"), line: 0,
                        }),
                    };
                    let operator = match self.advance().clone() {
                        Token::Gt  => CompareOp::Gt,
                        Token::Gte => CompareOp::Gte,
                        Token::Lt  => CompareOp::Lt,
                        Token::Lte => CompareOp::Lte,
                        Token::Eq  => CompareOp::Eq,
                        other => return Err(LiraError::UnexpectedToken {
                            expected: "comparison operator".into(),
                            got: format!("{other:?}"), line: 0,
                        }),
                    };
                    let value = match self.advance().clone() {
                        Token::FloatLit(f) => f,
                        Token::IntLit(i) => i as f64,
                        other => return Err(LiraError::UnexpectedToken {
                            expected: "price value (number)".into(),
                            got: format!("{other:?}"), line: 0,
                        }),
                    };
                    triggers.push(Trigger::PriceThreshold { pair, operator, value });
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
                other => return Err(LiraError::UnexpectedToken {
                    expected: "trigger declaration or '}'".into(),
                    got: format!("{other:?}"),
                    line: 0,
                }),
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
                Token::RBrace | Token::Eof => { self.advance(); break; }
                Token::Transfer => {
                    self.advance();
                    self.expect(&Token::From)?; self.expect(&Token::Colon)?;
                    let from = self.expect_ident()?;
                    self.expect(&Token::To)?; self.expect(&Token::Colon)?;
                    let to = self.expect_ident()?;
                    self.expect(&Token::Token_)?; self.expect(&Token::Colon)?;
                    let token = self.expect_ident()?;
                    self.expect(&Token::Amount)?; self.expect(&Token::Colon)?;
                    let amount = self.parse_expr()?;
                    actions.push(Action::Transfer { from, to, token, amount });
                }
                Token::State => {
                    self.advance();
                    self.expect(&Token::Colon)?;
                    let state = self.expect_ident()?;
                    actions.push(Action::Transition { state });
                }
                Token::Emit => {
                    self.advance();
                    self.expect(&Token::Event)?; self.expect(&Token::Colon)?;
                    let event = self.expect_ident()?;
                    actions.push(Action::Emit { event, payload: Vec::new() });
                }
                Token::Notify => {
                    self.advance();
                    self.expect(&Token::Recipient)?; self.expect(&Token::Colon)?;
                    let recipient = self.expect_ident()?;
                    self.expect(&Token::Message)?; self.expect(&Token::Colon)?;
                    let message = match self.advance().clone() {
                        Token::StringLit(s) => s,
                        other => return Err(LiraError::UnexpectedToken {
                            expected: "notification message string".into(),
                            got: format!("{other:?}"), line: 0,
                        }),
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
                        if self.peek() == &Token::RParen { self.advance(); break; }
                        args.push(self.parse_expr()?);
                        if self.peek() == &Token::Comma { self.advance(); }
                    }
                    actions.push(Action::ContractCall { contract, function, args });
                }
                other => return Err(LiraError::UnexpectedToken {
                    expected: "action declaration or '}'".into(),
                    got: format!("{other:?}"),
                    line: 0,
                }),
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
                Token::RBrace | Token::Eof => { self.advance(); break; }
                Token::Check => {
                    self.advance();
                    let id = self.expect_ident()?;
                    self.expect(&Token::Colon)?;
                    let condition = self.parse_expr()?;
                    self.expect(&Token::Message)?;
                    self.expect(&Token::Colon)?;
                    let message = match self.advance().clone() {
                        Token::StringLit(s) => s,
                        other => return Err(LiraError::UnexpectedToken {
                            expected: "check message string".into(),
                            got: format!("{other:?}"), line: 0,
                        }),
                    };
                    checks.push(SafetyCheck { id, condition, message });
                }
                other => return Err(LiraError::UnexpectedToken {
                    expected: "check declaration or '}'".into(),
                    got: format!("{other:?}"),
                    line: 0,
                }),
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
            Token::Gt  => BinOpKind::Gt,
            Token::Gte => BinOpKind::Gte,
            Token::Lt  => BinOpKind::Lt,
            Token::Lte => BinOpKind::Lte,
            Token::Eq  => BinOpKind::Eq,
            Token::Neq => BinOpKind::Neq,
            _ => return Ok(left),
        };
        self.advance();
        let right = self.parse_add()?;
        Ok(Expression::BinOp { op, left: Box::new(left), right: Box::new(right) })
    }

    fn parse_add(&mut self) -> Result<Expression, LiraError> {
        let mut left = self.parse_mul()?;
        loop {
            let op = match self.peek() {
                Token::Plus  => BinOpKind::Add,
                Token::Minus => BinOpKind::Sub,
                _ => break,
            };
            self.advance();
            let right = self.parse_mul()?;
            left = Expression::BinOp { op, left: Box::new(left), right: Box::new(right) };
        }
        Ok(left)
    }

    fn parse_mul(&mut self) -> Result<Expression, LiraError> {
        let mut left = self.parse_unary()?;
        loop {
            let op = match self.peek() {
                Token::Star  => BinOpKind::Mul,
                Token::Slash => BinOpKind::Div,
                _ => break,
            };
            self.advance();
            let right = self.parse_unary()?;
            left = Expression::BinOp { op, left: Box::new(left), right: Box::new(right) };
        }
        Ok(left)
    }

    fn parse_unary(&mut self) -> Result<Expression, LiraError> {
        match self.peek().clone() {
            Token::Not => {
                self.advance();
                Ok(Expression::UnaryOp { op: UnaryOpKind::Not, expr: Box::new(self.parse_primary()?) })
            }
            Token::Minus => {
                self.advance();
                Ok(Expression::UnaryOp { op: UnaryOpKind::Neg, expr: Box::new(self.parse_primary()?) })
            }
            _ => self.parse_primary(),
        }
    }

    fn parse_primary(&mut self) -> Result<Expression, LiraError> {
        match self.advance().clone() {
            Token::IntLit(v)    => Ok(Expression::IntLit { value: v }),
            Token::FloatLit(v)  => Ok(Expression::FloatLit { value: v }),
            Token::StringLit(v) => Ok(Expression::StrLit { value: v }),
            Token::BoolLit(v)   => Ok(Expression::BoolLit { value: v }),
            Token::Ident(name)  => Ok(Expression::Ident { name }),
            Token::LParen => {
                let expr = self.parse_expr()?;
                self.expect(&Token::RParen)?;
                Ok(expr)
            }
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
}
