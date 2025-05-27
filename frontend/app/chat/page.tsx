import { Suspense } from "react";
import ChatClientComponents from "./ChatClientComponents";

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatClientComponents />
    </Suspense>
  )
}
