import { cn } from "cn";

const SAMPLE = [
  { title: "Write the project outline", time: "9:00", done: true },
  { title: "Book flights to Da Nang", time: "11:30", done: true },
  { title: "Call Minh about the launch", time: "14:00", done: false },
  { title: "Go for a walk", time: "17:30", done: false },
];

// Decoration: a picture of the product made of tokens, so it needs no image and follows the theme.
export function DayPreview() {
  return (
    <div
      aria-hidden="true"
      className="m-3 hidden flex-col items-center justify-center gap-10 rounded-lg border bg-sidebar p-10 select-none lg:flex"
    >
      <div className="w-full max-w-sm">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-[22px]/7 font-[780]">Today</span>
          <span className="rounded-full bg-highlight px-2 text-xs/5 font-bold text-on-highlight">2 of 4 done</span>
        </div>
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 rounded-full bg-progress" />
        </div>
        <ul className="flex flex-col gap-2">
          {SAMPLE.map(({ title, time, done }) => (
            <li key={title} className="flex items-center gap-3 rounded-md border bg-card p-3 shadow-xs">
              <svg viewBox="0 0 20 20" className="size-5 shrink-0">
                <circle
                  cx="10"
                  cy="10"
                  r="9"
                  className={cn(
                    "stroke-[1.5]",
                    done ? "fill-progress stroke-progress" : "fill-transparent stroke-input",
                  )}
                />
                {done && (
                  <path
                    d="m6 10.5 2.5 2.5L14 7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="fill-none stroke-progress-foreground stroke-[1.5]"
                  />
                )}
              </svg>
              <span className={cn("flex-1 text-[15px]/[21px] font-medium", done && "text-muted-foreground")}>
                {title}
              </span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="max-w-sm text-center text-xl font-[760]">Plan on your own. Get it done together.</p>
    </div>
  );
}
