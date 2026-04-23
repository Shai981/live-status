import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Flag } from "lucide-react";

const REASONS = [
  { id: "spam", label: "Spam" },
  { id: "false_info", label: "False Information" },
  { id: "inappropriate", label: "Inappropriate Content" },
  { id: "offensive", label: "Offensive" },
  { id: "other", label: "Other" },
];

export default function ReportModal({ updateId, open, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const user = await base44.auth.me();
    await base44.entities.Report.create({
      update_id: updateId,
      reported_by: user.email,
      reason,
      details,
      status: "pending",
    });
    await base44.entities.StatusUpdate.update(updateId, {
      report_count: 1,
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" /> Report Update
          </DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="text-center py-6 text-green-600 font-medium">Report submitted. Thank you!</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReason(r.id)}
                  className={`text-left px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    reason === r.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Additional details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
            <Button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="w-full rounded-xl"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}