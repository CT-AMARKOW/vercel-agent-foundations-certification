"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductDetailsToolInvocation } from "@/lib/agent";

interface AgentProductCardProps {
  invocation: ProductDetailsToolInvocation;
}

export function AgentProductCard({ invocation }: AgentProductCardProps) {
  const [selected, setSelected] = useState(0);

  if (
    invocation.state === "input-streaming" ||
    invocation.state === "input-available"
  ) {
    const id = invocation.input?.idOrSlug;
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Looking up{id ? ` "${id}"` : ""}…
      </div>
    );
  }

  if (invocation.state !== "output-available") return null;

  const output = invocation.output;

  if (!output) return null;

  if ("error" in output) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {output.error as string}
      </div>
    );
  }

  const image = output.images[selected] ?? output.images[0];

  const stockLabel = !output.inStock
    ? "Out of stock"
    : output.lowStock
      ? `Only ${output.stock} left`
      : `In stock (${output.stock})`;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {image && (
        <div className="relative aspect-4/3 bg-secondary">
          <Image
            src={image}
            alt={output.name}
            fill
            sizes="(min-width: 768px) 480px, 100vw"
            className="object-cover"
          />
        </div>
      )}
      {output.images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-border p-2">
          {output.images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Show image ${i + 1} of ${output.images.length}`}
              className={cn(
                "relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary ring-offset-1",
                i === selected && "ring-2 ring-foreground",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold leading-tight">
              {output.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatPrice(output.price, output.currency)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              !output.inStock
                ? "bg-destructive/10 text-destructive"
                : output.lowStock
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            )}
          >
            {stockLabel}
          </span>
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {output.description}
        </p>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full border border-border px-2 py-0.5 text-xs">
            {output.category}
          </span>
          {output.featured && (
            <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
              Featured
            </span>
          )}
          {output.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-xs text-muted-foreground">
          <dt>ID</dt>
          <dd className="truncate font-mono">{output.id}</dd>
          <dt>Slug</dt>
          <dd className="truncate font-mono">{output.slug}</dd>
        </dl>
        <Link
          href={`/products/${output.slug}`}
          className="inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          View product →
        </Link>
      </div>
    </div>
  );
}
