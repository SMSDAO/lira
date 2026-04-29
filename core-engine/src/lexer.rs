/// Lexer for the Lira DSL.
///
/// The Lira DSL is a simple line-oriented, keyword-driven language.  The lexer
/// produces a flat `Vec<Token>` that the parser consumes.
use crate::error::LiraError;

// ──────────────────────────────────────────────────────────────────────────────
// Token types
// ──────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    // Literals
    IntLit(i64),
    FloatLit(f64),
    StringLit(String),
    BoolLit(bool),

    // Identifiers / keywords
    Ident(String),
    Version,
    Contract,
    States,
    Initial,
    Terminal,
    Transitions,
    Triggers,
    Actions,
    SafetyChecks,
    Transfer,
    Emit,
    Notify,
    Call,
    On,
    Schedule,
    MarginCall,
    PriceThreshold,
    OracleCallback,
    Guard,
    Check,
    Message,
    From,
    To,
    Token_, // the `token` field keyword (avoids collision with Rust `Token`)
    Amount,
    State,
    Pair,
    Source,
    Condition,
    Cron,
    CollatRatio,
    Function,
    Args,
    Event,
    Payload,
    Recipient,

    // Symbols
    Colon,
    Comma,
    Arrow, // ->
    LBrace,
    RBrace,
    LParen,
    RParen,
    LBracket,
    RBracket,
    Dot,
    Eq,     // ==
    Assign, // =
    Neq,    // !=
    Gt,
    Gte,
    Lt,
    Lte,
    And,
    Or,
    Not,
    Plus,
    Minus,
    Star,
    Slash,

    // Meta
    Newline,
    Eof,
}

// ──────────────────────────────────────────────────────────────────────────────
// Lexer
// ──────────────────────────────────────────────────────────────────────────────

pub struct Lexer<'a> {
    src: &'a [u8],
    pos: usize,
    line: usize,
    col: usize,
}

impl<'a> Lexer<'a> {
    pub fn new(src: &'a str) -> Self {
        Self {
            src: src.as_bytes(),
            pos: 0,
            line: 1,
            col: 1,
        }
    }

    pub fn tokenize(mut self) -> Result<Vec<Token>, LiraError> {
        let mut tokens = Vec::new();
        loop {
            let tok = self.next_token()?;
            let is_eof = tok == Token::Eof;
            if tok != Token::Newline {
                tokens.push(tok);
            }
            if is_eof {
                break;
            }
        }
        Ok(tokens)
    }

    fn peek(&self) -> Option<u8> {
        self.src.get(self.pos).copied()
    }

    fn peek2(&self) -> Option<u8> {
        self.src.get(self.pos + 1).copied()
    }

    fn advance(&mut self) -> Option<u8> {
        let ch = self.src.get(self.pos).copied();
        if let Some(b) = ch {
            self.pos += 1;
            if b == b'\n' {
                self.line += 1;
                self.col = 1;
            } else {
                self.col += 1;
            }
        }
        ch
    }

    fn skip_whitespace_and_comments(&mut self) {
        loop {
            match self.peek() {
                Some(b' ') | Some(b'\t') | Some(b'\r') => {
                    self.advance();
                }
                Some(b'#') => {
                    // line comment
                    while self.peek().is_some_and(|b| b != b'\n') {
                        self.advance();
                    }
                }
                _ => break,
            }
        }
    }

    fn read_string(&mut self) -> Result<String, LiraError> {
        let start_line = self.line;
        self.advance(); // consume opening `"`
        let mut s = String::new();
        loop {
            match self.advance() {
                None => return Err(LiraError::UnterminatedString { line: start_line }),
                Some(b'"') => break,
                Some(b'\\') => match self.advance() {
                    Some(b'n') => s.push('\n'),
                    Some(b't') => s.push('\t'),
                    Some(b'"') => s.push('"'),
                    Some(b'\\') => s.push('\\'),
                    Some(other) => s.push(other as char),
                    None => return Err(LiraError::UnterminatedString { line: start_line }),
                },
                Some(b) => s.push(b as char),
            }
        }
        Ok(s)
    }

    fn read_number(&mut self) -> Result<Token, LiraError> {
        let line = self.line;
        let mut buf = String::new();
        let mut dot_count = 0usize;
        while let Some(b) = self.peek() {
            if b.is_ascii_digit() || b == b'.' || b == b'_' {
                if b == b'.' {
                    dot_count += 1;
                }
                if b != b'_' {
                    buf.push(b as char);
                }
                self.advance();
            } else {
                break;
            }
        }
        // Guard against underscore-only inputs (e.g. `1_` produces buf="1", never truly
        // empty since the caller ensures the first byte is ascii_digit, but kept as a
        // safety net) and multiple-dot floats (e.g. `1.2.3`).
        if buf.is_empty() || dot_count > 1 {
            return Err(LiraError::InvalidNumericLiteral { literal: buf, line });
        }
        if dot_count == 1 {
            buf.parse::<f64>()
                .map(Token::FloatLit)
                .map_err(|_| LiraError::InvalidNumericLiteral { literal: buf, line })
        } else {
            buf.parse::<i64>()
                .map(Token::IntLit)
                .map_err(|_| LiraError::InvalidNumericLiteral { literal: buf, line })
        }
    }

    fn read_ident_or_keyword(&mut self) -> Token {
        let mut buf = String::new();
        while let Some(b) = self.peek() {
            if b.is_ascii_alphanumeric() || b == b'_' {
                buf.push(b as char);
                self.advance();
            } else {
                break;
            }
        }
        match buf.as_str() {
            "true" => Token::BoolLit(true),
            "false" => Token::BoolLit(false),
            "version" => Token::Version,
            "contract" => Token::Contract,
            "states" => Token::States,
            "initial" => Token::Initial,
            "terminal" => Token::Terminal,
            "transitions" => Token::Transitions,
            "triggers" => Token::Triggers,
            "actions" => Token::Actions,
            "safety_checks" => Token::SafetyChecks,
            "transfer" => Token::Transfer,
            "emit" => Token::Emit,
            "notify" => Token::Notify,
            "call" => Token::Call,
            "on" => Token::On,
            "schedule" => Token::Schedule,
            "margin_call" => Token::MarginCall,
            "price_threshold" => Token::PriceThreshold,
            "oracle_callback" => Token::OracleCallback,
            "guard" => Token::Guard,
            "check" => Token::Check,
            "message" => Token::Message,
            "from" => Token::From,
            "to" => Token::To,
            "token" => Token::Token_,
            "amount" => Token::Amount,
            "state" => Token::State,
            "pair" => Token::Pair,
            "source" => Token::Source,
            "condition" => Token::Condition,
            "cron" => Token::Cron,
            "collateral_ratio" => Token::CollatRatio,
            "function" => Token::Function,
            "args" => Token::Args,
            "event" => Token::Event,
            "payload" => Token::Payload,
            "recipient" => Token::Recipient,
            "and" => Token::And,
            "or" => Token::Or,
            "not" => Token::Not,
            _ => Token::Ident(buf),
        }
    }

    fn next_token(&mut self) -> Result<Token, LiraError> {
        self.skip_whitespace_and_comments();
        match self.peek() {
            None => Ok(Token::Eof),
            Some(b'\n') => {
                self.advance();
                Ok(Token::Newline)
            }
            Some(b'"') => {
                let s = self.read_string()?;
                Ok(Token::StringLit(s))
            }
            Some(b) if b.is_ascii_digit() => self.read_number(),
            Some(b'-') if self.peek2() == Some(b'>') => {
                self.advance();
                self.advance();
                Ok(Token::Arrow)
            }
            Some(b'-') => {
                self.advance();
                Ok(Token::Minus)
            }
            Some(b'+') => {
                self.advance();
                Ok(Token::Plus)
            }
            Some(b'*') => {
                self.advance();
                Ok(Token::Star)
            }
            Some(b'/') => {
                self.advance();
                Ok(Token::Slash)
            }
            Some(b':') => {
                self.advance();
                Ok(Token::Colon)
            }
            Some(b',') => {
                self.advance();
                Ok(Token::Comma)
            }
            Some(b'{') => {
                self.advance();
                Ok(Token::LBrace)
            }
            Some(b'}') => {
                self.advance();
                Ok(Token::RBrace)
            }
            Some(b'(') => {
                self.advance();
                Ok(Token::LParen)
            }
            Some(b')') => {
                self.advance();
                Ok(Token::RParen)
            }
            Some(b'[') => {
                self.advance();
                Ok(Token::LBracket)
            }
            Some(b']') => {
                self.advance();
                Ok(Token::RBracket)
            }
            Some(b'.') => {
                self.advance();
                Ok(Token::Dot)
            }
            Some(b'>') if self.peek2() == Some(b'=') => {
                self.advance();
                self.advance();
                Ok(Token::Gte)
            }
            Some(b'>') => {
                self.advance();
                Ok(Token::Gt)
            }
            Some(b'<') if self.peek2() == Some(b'=') => {
                self.advance();
                self.advance();
                Ok(Token::Lte)
            }
            Some(b'<') => {
                self.advance();
                Ok(Token::Lt)
            }
            Some(b'=') if self.peek2() == Some(b'=') => {
                self.advance();
                self.advance();
                Ok(Token::Eq)
            }
            Some(b'=') => {
                self.advance();
                Ok(Token::Assign)
            }
            Some(b'!') if self.peek2() == Some(b'=') => {
                self.advance();
                self.advance();
                Ok(Token::Neq)
            }
            Some(b) if b.is_ascii_alphabetic() || b == b'_' => Ok(self.read_ident_or_keyword()),
            Some(ch) => {
                let line = self.line;
                let col = self.col;
                self.advance();
                Err(LiraError::UnexpectedChar {
                    ch: ch as char,
                    line,
                    col,
                })
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokenizes_version() {
        let tokens = Lexer::new("version \"1.0\"").tokenize().unwrap();
        assert_eq!(tokens[0], Token::Version);
        assert_eq!(tokens[1], Token::StringLit("1.0".into()));
    }

    #[test]
    fn tokenizes_arrow() {
        let tokens = Lexer::new("A -> B").tokenize().unwrap();
        assert_eq!(tokens[1], Token::Arrow);
    }

    #[test]
    fn tokenizes_numbers() {
        let tokens = Lexer::new("42 3.14").tokenize().unwrap();
        assert_eq!(tokens[0], Token::IntLit(42));
        assert_eq!(tokens[1], Token::FloatLit(3.14));
    }

    #[test]
    fn skips_comments() {
        let tokens = Lexer::new("# this is a comment\nversion \"1.0\"")
            .tokenize()
            .unwrap();
        assert_eq!(tokens[0], Token::Version);
    }

    #[test]
    fn unterminated_string_error() {
        let result = Lexer::new("\"oops").tokenize();
        assert!(matches!(result, Err(LiraError::UnterminatedString { .. })));
    }

    #[test]
    fn tokenizes_booleans() {
        let tokens = Lexer::new("true false").tokenize().unwrap();
        assert_eq!(tokens[0], Token::BoolLit(true));
        assert_eq!(tokens[1], Token::BoolLit(false));
    }

    #[test]
    fn tokenizes_keywords() {
        let src =
            "version contract states initial terminal transitions triggers actions safety_checks";
        let tokens = Lexer::new(src).tokenize().unwrap();
        assert_eq!(tokens[0], Token::Version);
        assert_eq!(tokens[1], Token::Contract);
        assert_eq!(tokens[2], Token::States);
        assert_eq!(tokens[3], Token::Initial);
        assert_eq!(tokens[4], Token::Terminal);
        assert_eq!(tokens[5], Token::Transitions);
        assert_eq!(tokens[6], Token::Triggers);
        assert_eq!(tokens[7], Token::Actions);
        assert_eq!(tokens[8], Token::SafetyChecks);
    }

    #[test]
    fn tokenizes_action_keywords() {
        let src = "transfer emit notify call";
        let tokens = Lexer::new(src).tokenize().unwrap();
        assert_eq!(tokens[0], Token::Transfer);
        assert_eq!(tokens[1], Token::Emit);
        assert_eq!(tokens[2], Token::Notify);
        assert_eq!(tokens[3], Token::Call);
    }

    #[test]
    fn tokenizes_field_keywords() {
        let src = "from to token amount state pair source condition cron collateral_ratio function args event payload recipient";
        let tokens = Lexer::new(src).tokenize().unwrap();
        assert_eq!(tokens[0], Token::From);
        assert_eq!(tokens[1], Token::To);
        assert_eq!(tokens[2], Token::Token_);
        assert_eq!(tokens[3], Token::Amount);
        assert_eq!(tokens[4], Token::State);
        assert_eq!(tokens[5], Token::Pair);
        assert_eq!(tokens[6], Token::Source);
        assert_eq!(tokens[7], Token::Condition);
        assert_eq!(tokens[8], Token::Cron);
        assert_eq!(tokens[9], Token::CollatRatio);
        assert_eq!(tokens[10], Token::Function);
        assert_eq!(tokens[11], Token::Args);
        assert_eq!(tokens[12], Token::Event);
        assert_eq!(tokens[13], Token::Payload);
        assert_eq!(tokens[14], Token::Recipient);
    }

    #[test]
    fn tokenizes_trigger_keywords() {
        let src = "on schedule margin_call price_threshold oracle_callback";
        let tokens = Lexer::new(src).tokenize().unwrap();
        assert_eq!(tokens[0], Token::On);
        assert_eq!(tokens[1], Token::Schedule);
        assert_eq!(tokens[2], Token::MarginCall);
        assert_eq!(tokens[3], Token::PriceThreshold);
        assert_eq!(tokens[4], Token::OracleCallback);
    }

    #[test]
    fn tokenizes_comparison_operators() {
        let tokens = Lexer::new("> >= < <= == !=").tokenize().unwrap();
        assert_eq!(tokens[0], Token::Gt);
        assert_eq!(tokens[1], Token::Gte);
        assert_eq!(tokens[2], Token::Lt);
        assert_eq!(tokens[3], Token::Lte);
        assert_eq!(tokens[4], Token::Eq);
        assert_eq!(tokens[5], Token::Neq);
    }

    #[test]
    fn tokenizes_arithmetic_operators() {
        let tokens = Lexer::new("+ - * /").tokenize().unwrap();
        assert_eq!(tokens[0], Token::Plus);
        assert_eq!(tokens[1], Token::Minus);
        assert_eq!(tokens[2], Token::Star);
        assert_eq!(tokens[3], Token::Slash);
    }

    #[test]
    fn tokenizes_brackets_and_delimiters() {
        let tokens = Lexer::new("{ } ( ) [ ] . : ,").tokenize().unwrap();
        assert_eq!(tokens[0], Token::LBrace);
        assert_eq!(tokens[1], Token::RBrace);
        assert_eq!(tokens[2], Token::LParen);
        assert_eq!(tokens[3], Token::RParen);
        assert_eq!(tokens[4], Token::LBracket);
        assert_eq!(tokens[5], Token::RBracket);
        assert_eq!(tokens[6], Token::Dot);
        assert_eq!(tokens[7], Token::Colon);
        assert_eq!(tokens[8], Token::Comma);
    }

    #[test]
    fn tokenizes_assignment_and_logic() {
        let tokens = Lexer::new("= and or not guard check message")
            .tokenize()
            .unwrap();
        assert_eq!(tokens[0], Token::Assign);
        assert_eq!(tokens[1], Token::And);
        assert_eq!(tokens[2], Token::Or);
        assert_eq!(tokens[3], Token::Not);
        assert_eq!(tokens[4], Token::Guard);
        assert_eq!(tokens[5], Token::Check);
        assert_eq!(tokens[6], Token::Message);
    }

    #[test]
    fn tokenizes_float_with_underscore() {
        let tokens = Lexer::new("1_000_000").tokenize().unwrap();
        assert_eq!(tokens[0], Token::IntLit(1_000_000));
    }

    #[test]
    fn tokenizes_escape_sequences_in_string() {
        let tokens = Lexer::new("\"hello\\nworld\"").tokenize().unwrap();
        assert_eq!(tokens[0], Token::StringLit("hello\nworld".into()));
    }

    #[test]
    fn unterminated_string_after_escape() {
        let result = Lexer::new("\"oops\\").tokenize();
        assert!(matches!(result, Err(LiraError::UnterminatedString { .. })));
    }

    #[test]
    fn unexpected_char_error() {
        let result = Lexer::new("@").tokenize();
        assert!(matches!(result, Err(LiraError::UnexpectedChar { .. })));
    }

    #[test]
    fn tokenizes_ident() {
        let tokens = Lexer::new("MyContract").tokenize().unwrap();
        assert_eq!(tokens[0], Token::Ident("MyContract".into()));
    }

    #[test]
    fn tokenizes_tab_escape_in_string() {
        let tokens = Lexer::new("\"col1\\tcol2\"").tokenize().unwrap();
        assert_eq!(tokens[0], Token::StringLit("col1\tcol2".into()));
    }

    #[test]
    fn tokenizes_quote_escape_in_string() {
        let tokens = Lexer::new("\"say \\\"hi\\\"\"").tokenize().unwrap();
        assert_eq!(tokens[0], Token::StringLit("say \"hi\"".into()));
    }

    #[test]
    fn tokenizes_backslash_escape_in_string() {
        let tokens = Lexer::new("\"path\\\\file\"").tokenize().unwrap();
        assert_eq!(tokens[0], Token::StringLit("path\\file".into()));
    }

    #[test]
    fn tokenizes_unknown_escape_as_char() {
        let tokens = Lexer::new("\"\\x\"").tokenize().unwrap();
        assert_eq!(tokens[0], Token::StringLit("x".into()));
    }

    #[test]
    fn tokenizes_minus_standalone() {
        // A lone `-` that is NOT followed by `>` should be Token::Minus
        let tokens = Lexer::new("a - b").tokenize().unwrap();
        assert_eq!(tokens[1], Token::Minus);
    }
}
