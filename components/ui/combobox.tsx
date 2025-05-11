"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "../../lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"


type FormDropdownProps = {
    type: string;
    keys: string[];
    values: string[];
    onChange: (value: string) => void;
}

export function ComboboxDropdown({ type, keys, values, onChange }: FormDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
      className="bg-foreground-secondary border-border border-2 rounded-md text-text w-full h-full p-2"
      asChild>
        <button aria-expanded={open} type="button" className="w-full h-full flex items-center justify-between" onClick={() => setOpen(!open)}>
          <span className="text">{value}</span>
          <ChevronsUpDown className="ml-20 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="bg-foreground-secondary border-border rounded-sm">
        <Command>
          <CommandInput placeholder={`Select a ${type}`} className="text-text" />
          <CommandList >
            <CommandEmpty>{type} not found</CommandEmpty>
            <CommandGroup>
              {keys.map((key, index) => (
                key == "Israel" ? 
                <CommandItem
                className="text-text"
                  key={index}
                  disabled
                  value={"IsNotReal"}
                  >

                </CommandItem> :
                <CommandItem
                className="text-text"
                  key={index}
                  value={values[index]}
                  onSelect={(currentValue) => {
                    onChange(currentValue)
                    setOpen(false)
                    setValue(currentValue)
                  }}
                >
                  {/* <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === values[index] ? "opacity-100" : "opacity-0"
                    )}
                  /> */}
                  {key}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
