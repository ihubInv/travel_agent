import React, { Suspense } from "react";
import RegisterClientComponent from "./RegisterClientComponent"

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterClientComponent />
    </Suspense>
  )
}
