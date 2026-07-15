"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-[#5A8A7C]" />,
        info: <InfoIcon className="size-4 text-[#B8943C]" />,
        warning: <TriangleAlertIcon className="size-4 text-[#D4783C]" />,
        error: <OctagonXIcon className="size-4 text-[#B84747]" />,
        loading: <Loader2Icon className="size-4 animate-spin text-[#D4783C]" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group-[.toaster]:bg-[#1C1A17] group-[.toaster]:text-[#E6DCC3] group-[.toaster]:border-[#36302A] group-[.toaster]:shadow-lg font-sans text-xs rounded-xl",
          success: "group-[.toaster]:border-[#5A8A7C]/40 group-[.toaster]:shadow-[#5A8A7C]/5",
          error: "group-[.toaster]:border-[#B84747]/40 group-[.toaster]:shadow-[#B84747]/5",
          warning: "group-[.toaster]:border-[#D4783C]/40 group-[.toaster]:shadow-[#D4783C]/5",
          info: "group-[.toaster]:border-[#36302A] group-[.toaster]:shadow-sm",
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
