import React, { Suspense } from "react";
import LoginClientComponent from "./LoginClientComponent";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginClientComponent />
    </Suspense>
  )
}
