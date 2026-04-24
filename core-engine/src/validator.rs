/// Validator for Lira AST nodes.
///
/// The validator performs semantic checks that are too expensive or awkward to
/// integrate into the parser, including the *Safety-First* undefined-state check.
use std::collections::HashSet;

use crate::ast::{Action, Expression, LiraContract};
use crate::error::LiraError;

/// Run all validation passes on a parsed contract.
///
/// When `safety_first` is `true` the validator rejects any contract that
/// references a state that was not declared in the `states` block — preventing
/// "logic-bleed" where an undefined execution path could be reached at runtime.
pub fn validate(contract: &LiraContract, safety_first: bool) -> Result<(), Vec<LiraError>> {
    let mut errors: Vec<LiraError> = Vec::new();

    // ── Pass 1: At least one state declared ───────────────────────────────────
    if contract.states.is_empty() {
        errors.push(LiraError::NoStates {
            name: contract.name.clone(),
        });
    }

    // ── Pass 2: Exactly one initial state ─────────────────────────────────────
    let initial_count = contract.states.iter().filter(|s| s.initial).count();
    if !contract.states.is_empty() && initial_count != 1 {
        errors.push(LiraError::InitialStateCount {
            name: contract.name.clone(),
            count: initial_count,
        });
    }

    // ── Pass 3: Safety-First — undefined state references ─────────────────────
    if safety_first {
        let declared: HashSet<&str> = contract.states.iter().map(|s| s.name.as_str()).collect();

        for t in &contract.transitions {
            if !declared.contains(t.from.as_str()) {
                errors.push(LiraError::UndefinedState {
                    state: t.from.clone(),
                    from: t.from.clone(),
                    to: t.to.clone(),
                });
            }
            if !declared.contains(t.to.as_str()) {
                errors.push(LiraError::UndefinedState {
                    state: t.to.clone(),
                    from: t.from.clone(),
                    to: t.to.clone(),
                });
            }
        }

        // Check Transition actions
        for action in &contract.actions {
            if let Action::Transition { state } = action {
                if !declared.contains(state.as_str()) {
                    errors.push(LiraError::UndefinedTransitionTarget {
                        state: state.clone(),
                    });
                }
            }
        }
    }

    // ── Pass 4: Trivially-false safety checks ─────────────────────────────────
    for check in &contract.safety_checks {
        if let Expression::BoolLit { value: false } = &check.condition {
            errors.push(LiraError::TriviallyFalseCheck {
                id: check.id.clone(),
            });
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ast::*;

    fn make_contract(states: Vec<State>, transitions: Vec<Transition>) -> LiraContract {
        LiraContract {
            version: "1.0".into(),
            name: "T".into(),
            states,
            transitions,
            triggers: vec![],
            actions: vec![],
            safety_checks: vec![],
        }
    }

    #[test]
    fn valid_contract_passes() {
        let c = make_contract(
            vec![
                State {
                    name: "A".into(),
                    initial: true,
                    terminal: false,
                },
                State {
                    name: "B".into(),
                    initial: false,
                    terminal: true,
                },
            ],
            vec![Transition {
                from: "A".into(),
                to: "B".into(),
                guard: None,
            }],
        );
        assert!(validate(&c, true).is_ok());
    }

    #[test]
    fn safety_first_rejects_undefined_state() {
        let c = make_contract(
            vec![State {
                name: "A".into(),
                initial: true,
                terminal: false,
            }],
            vec![Transition {
                from: "A".into(),
                to: "GHOST".into(),
                guard: None,
            }],
        );
        let errs = validate(&c, true).unwrap_err();
        assert!(errs
            .iter()
            .any(|e| matches!(e, LiraError::UndefinedState { .. })));
    }

    #[test]
    fn non_strict_allows_undefined_state() {
        let c = make_contract(
            vec![State {
                name: "A".into(),
                initial: true,
                terminal: false,
            }],
            vec![Transition {
                from: "A".into(),
                to: "GHOST".into(),
                guard: None,
            }],
        );
        // With safety_first = false, undefined states are not checked.
        assert!(validate(&c, false).is_ok());
    }

    #[test]
    fn no_states_error() {
        let c = make_contract(vec![], vec![]);
        let errs = validate(&c, true).unwrap_err();
        assert!(errs.iter().any(|e| matches!(e, LiraError::NoStates { .. })));
    }

    #[test]
    fn multiple_initial_states_error() {
        let c = make_contract(
            vec![
                State {
                    name: "A".into(),
                    initial: true,
                    terminal: false,
                },
                State {
                    name: "B".into(),
                    initial: true,
                    terminal: false,
                },
            ],
            vec![],
        );
        let errs = validate(&c, true).unwrap_err();
        assert!(errs
            .iter()
            .any(|e| matches!(e, LiraError::InitialStateCount { .. })));
    }

    #[test]
    fn trivially_false_check_error() {
        let mut c = make_contract(
            vec![State {
                name: "A".into(),
                initial: true,
                terminal: false,
            }],
            vec![],
        );
        c.safety_checks.push(SafetyCheck {
            id: "always_false".into(),
            condition: Expression::BoolLit { value: false },
            message: "will always revert".into(),
        });
        let errs = validate(&c, true).unwrap_err();
        assert!(errs
            .iter()
            .any(|e| matches!(e, LiraError::TriviallyFalseCheck { .. })));
    }
}
