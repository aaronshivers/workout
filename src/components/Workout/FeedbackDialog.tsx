import type { Feedback } from '@/services/WorkoutService';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { JSX } from 'react';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: Feedback;
  setFeedback: (feedback: Feedback) => void;
  onSave: () => void;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  feedback,
  setFeedback,
  onSave,
}: FeedbackDialogProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exercise Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Joint Pain</Label>
            <RadioGroup
              value={feedback.joint_pain}
              onValueChange={(value) =>
                setFeedback({
                  ...feedback,
                  joint_pain: value as Feedback['joint_pain'],
                })
              }
            >
              {['LOW', 'MODERATE', 'A_LOT'].map((val) => (
                <div key={val} className="flex items-center space-x-2">
                  <RadioGroupItem value={val} id={`jp-${val.toLowerCase()}`} />
                  <Label htmlFor={`jp-${val.toLowerCase()}`}>
                    {val.charAt(0) +
                      val.slice(1).toLowerCase().replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label>Pump</Label>
            <RadioGroup
              value={feedback.pump}
              onValueChange={(value) =>
                setFeedback({ ...feedback, pump: value as Feedback['pump'] })
              }
            >
              {['LOW', 'MODERATE', 'AMAZING'].map((val) => (
                <div key={val} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={val}
                    id={`pump-${val.toLowerCase()}`}
                  />
                  <Label htmlFor={`pump-${val.toLowerCase()}`}>
                    {val.charAt(0) + val.slice(1).toLowerCase()}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label>Workload</Label>
            <RadioGroup
              value={feedback.workload}
              onValueChange={(value) =>
                setFeedback({
                  ...feedback,
                  workload: value as Feedback['workload'],
                })
              }
            >
              {['EASY', 'PRETTY_GOOD', 'PUSHED_LIMITS', 'TOO_MUCH'].map(
                (val) => (
                  <div key={val} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={val}
                      id={`wl-${val.toLowerCase()}`}
                    />
                    <Label htmlFor={`wl-${val.toLowerCase()}`}>
                      {val
                        .split('_')
                        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                        .join(' ')}
                    </Label>
                  </div>
                ),
              )}
            </RadioGroup>
          </div>
          <div>
            <Label>Performance</Label>
            <RadioGroup
              value={feedback.performance.toString()}
              onValueChange={(value) =>
                setFeedback({
                  ...feedback,
                  performance: parseInt(value, 10) as Feedback['performance'],
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="perf-1" />
                <Label htmlFor="perf-1">
                  Exceeded Targets (&gt;2 RIR or extra reps)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="perf-2" />
                <Label htmlFor="perf-2">
                  Met Targets (0-1 RIR, no extra reps)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="perf-3" />
                <Label htmlFor="perf-3">
                  Below Targets (Lower RIR than expected)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="perf-4" />
                <Label htmlFor="perf-4">Couldn’t Match Last Week’s Reps</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
