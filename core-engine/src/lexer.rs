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

    fn read_number(&mut self) -> Token {
        let mut buf = String::new();
        let mut is_float = false;
        while let Some(b) = self.peek() {
            if b.is_ascii_digit() || b == b'.' || b == b'_' {
                if b == b'.' {
                    is_float = true;
                }
                if b != b'_' {
                    buf.push(b as char);
                }
                self.advance();
            } else {
                break;
            }
        }
        if is_float {
            Token::FloatLit(buf.parse().unwrap_or(0.0))
        } else {
            Token::IntLit(buf.parse().unwrap_or(0))
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
            Some(b) if b.is_ascii_digit() => Ok(self.read_number()),
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
}
