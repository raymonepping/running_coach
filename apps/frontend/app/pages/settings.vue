<template>
  <PageHeader
    description="Local services are composed explicitly so security, model behavior, and storage boundaries stay visible."
    eyebrow="Local stack"
    title="Settings"
  />
  <section class="grid gap-5 lg:grid-cols-2">
    <SignalPanel title="Runtime services">
      <dl class="space-y-3 text-sm">
        <div class="flex justify-between gap-4">
          <dt class="font-semibold text-neutral-500">Backend</dt>
          <dd>http://localhost:8080</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="font-semibold text-neutral-500">Ollama</dt>
          <dd>llama3.1:8b</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="font-semibold text-neutral-500">Vault</dt>
          <dd>AppRole + KV + transit</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="font-semibold text-neutral-500">Couchbase</dt>
          <dd>running_coach.coach</dd>
        </div>
      </dl>
    </SignalPanel>
    <SignalPanel title="Safety posture">
      <p class="text-sm leading-6 text-neutral-700">
        Readiness and risk logic are deterministic. Model output is limited to explanation writing and cannot approve recommendations.
      </p>
    </SignalPanel>
  </section>
</template>
