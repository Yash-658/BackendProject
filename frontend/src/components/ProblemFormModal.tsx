import { useEffect, useState, type FormEvent } from "react";
import { createProblem, getErrorMessage, updateProblem } from "../api";
import type { Problem, TestCaseCreate } from "../types";
import { ErrorBanner } from "./FeedbackStates";
import { Modal } from "./Modal";

interface ProblemFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialProblem?: Problem | null;
  onClose: () => void;
  onSuccess: (problem: Problem) => void;
}

const EMPTY_TEST_CASE: TestCaseCreate = {
  input_data: "",
  expected_output: "",
};

export function ProblemFormModal({
  isOpen,
  mode,
  initialProblem = null,
  onClose,
  onSuccess,
}: ProblemFormModalProps) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [testCases, setTestCases] = useState<TestCaseCreate[]>([{ ...EMPTY_TEST_CASE }]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setValidationError(null);
    setSubmitError(null);
    if (mode === "edit" && initialProblem) {
      setTitle(initialProblem.title);
      setDifficulty(initialProblem.difficulty);
    } else {
      setTitle("");
      setDifficulty("Easy");
      setTestCases([{ ...EMPTY_TEST_CASE }]);
    }
  }, [isOpen, mode, initialProblem]);

  function handleAddTestCaseRow() {
    setTestCases((prev) => [...prev, { ...EMPTY_TEST_CASE }]);
  }

  function handleRemoveTestCaseRow(index: number) {
    setTestCases((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleTestCaseChange(
    index: number,
    field: keyof TestCaseCreate,
    value: string
  ) {
    setTestCases((prev) =>
      prev.map((tc, idx) => (idx === index ? { ...tc, [field]: value } : tc))
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    setSubmitError(null);

    const trimmedTitle = title.trim();
    const trimmedDifficulty = difficulty.trim();

    if (!trimmedTitle) {
      setValidationError("Title is required.");
      return;
    }
    if (!trimmedDifficulty) {
      setValidationError("Difficulty is required.");
      return;
    }

    if (mode === "create") {
      const hasIncompleteTestCase = testCases.some(
        (tc) => tc.expected_output.trim().length === 0
      );
      if (hasIncompleteTestCase) {
        setValidationError(
          "Each test case must have a non-empty expected output (or remove unused rows)."
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let saved: Problem;
      if (mode === "create") {
        saved = await createProblem({
          title: trimmedTitle,
          difficulty: trimmedDifficulty,
          test_cases: testCases,
        });
      } else if (initialProblem) {
        saved = await updateProblem(initialProblem.id, {
          title: trimmedTitle,
          difficulty: trimmedDifficulty,
        });
      } else {
        throw new Error("No problem selected to update.");
      }

      onSuccess(saved);
      onClose();
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Failed to save problem."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={mode === "create" ? "Create Problem" : "Edit Problem"}
      onClose={onClose}
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="stack-md" noValidate>
        <p className="helper-note">
          Requires an <strong>admin</strong> account. Standard user accounts will receive
          a <code>403 Insufficient permissions</code> response.
        </p>

        {validationError && <ErrorBanner message={validationError} />}
        {submitError && <ErrorBanner message={submitError} />}

        <div className="form-field">
          <label htmlFor="problem-title">Title</label>
          <input
            id="problem-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Two Sum"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="problem-difficulty">Difficulty</label>
          <input
            id="problem-difficulty"
            type="text"
            list="difficulty-suggestions"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            placeholder="Easy, Medium, or Hard"
            disabled={isSubmitting}
            required
          />
          <datalist id="difficulty-suggestions">
            <option value="Easy" />
            <option value="Medium" />
            <option value="Hard" />
          </datalist>
        </div>

        {mode === "create" && (
          <fieldset className="testcase-fieldset">
            <legend>Initial Test Cases ({testCases.length})</legend>
            <div className="stack-sm">
              {testCases.map((tc, index) => (
                <div key={index} className="testcase-card">
                  <div className="testcase-card-header">
                    <span>Test Case #{index + 1}</span>
                    {testCases.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleRemoveTestCaseRow(index)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="testcase-grid">
                    <div className="form-field">
                      <label htmlFor={`tc-input-${index}`}>Input (stdin)</label>
                      <textarea
                        id={`tc-input-${index}`}
                        rows={2}
                        value={tc.input_data}
                        onChange={(e) =>
                          handleTestCaseChange(index, "input_data", e.target.value)
                        }
                        placeholder="Optional stdin"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor={`tc-output-${index}`}>Expected Output</label>
                      <textarea
                        id={`tc-output-${index}`}
                        rows={2}
                        value={tc.expected_output}
                        onChange={(e) =>
                          handleTestCaseChange(index, "expected_output", e.target.value)
                        }
                        placeholder="Expected stdout"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleAddTestCaseRow}
              disabled={isSubmitting}
            >
              + Add another test case
            </button>
          </fieldset>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
              ? "Create Problem"
              : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
