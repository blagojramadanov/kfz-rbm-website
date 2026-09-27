/**
 * Spam trap for the public forms: an input people never see or reach with the
 * keyboard, but form-filling bots do. The server actions (app/actions/inquiries.ts)
 * silently drop a submission whose `website` field is not empty.
 */
export function HoneypotField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
      <label>
        {label}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
