import { useEffect, useState, type FormEvent } from "react";
import { addTestCase, getErrorMessage } from "../api";
import type { TestCaseResponse } from "../types";
import { ErrorBanner } from "./FeedbackStates";
import { Modal } from "./Modal";

interface TestCaseModalProps {
  isOpen: boolean;
  problemId: number;
  problemTitle: string;
  onClose: () => void;
  onSuccess: (created: TestCaseResponse) => void;
}

export function TestCaseModal({
  isOpen,
  problemId,
  problemTitle,
  onClose,
  onSuccess,
}: TestCaseModalProps) {
  const [inputData, setInputData] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setInputData("");
    setExpectedOutput("");
    setValidationError(null);
    setSubmitError(null);
  }, [isOpen, problemId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setValidationError(null);
    setSubmitError(null);

    if (!expectedOutput.trim()) {
      setValidationError("Expected output is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await addTestCase(problemId, {
        input_data: inputData,
        expected_output: expectedOutput,
      });
      onSuccess(created);
      onClose();
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Failed to add test case."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={`Add Test Case — ${problemTitle}`}
      onClose={onClose}
      disableClose={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="stack-md" noValidate>
        <p className="helper-note">
          Requires an <strong>admin</strong> account (<code>POST /problems/{problemId}/test_cases</code>).
        </p>

        {validationError && <ErrorBanner message={validationError} />}
        {submitError && <ErrorBanner message={submitError} />}

        <div className="form-field">
          <label htmlFor="new-tc-input">Input Data (stdin)</label>
          <textarea
            id="new-tc-input"
            rows={4}
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Input passed to stdin (leave blank if none)"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-field">
          <label htmlFor="new-tc-output">Expected Output (stdout)</label>
          <textarea
            id="new-tc-output"
            rows={4}
            value={expectedOutput}
            onChange={(e) => setExpectedOutput(e.target.value)}
            placeholder="Expected output (leading/trailing whitespace is normalized by the judge)"
            disabled={isSubmitting}
            required
          />
        </div>

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
            {isSubmitting ? "Adding..." : "Add Test Case"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
