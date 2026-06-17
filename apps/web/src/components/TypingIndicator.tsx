export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[20px] rounded-bl-md bg-gray-100/80 px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-gray-400/70" />
          <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-gray-400/70 [animation-delay:150ms]" />
          <span className="h-[7px] w-[7px] animate-bounce rounded-full bg-gray-400/70 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
