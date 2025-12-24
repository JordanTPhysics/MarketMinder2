"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

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
    defaultValue?: string;
    className?: string;
}

export function ComboboxDropdown({ type, keys, values, onChange, defaultValue, className }: FormDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue || "")
  const [inputValue, setInputValue] = React.useState(defaultValue || "")

  // When user selects from the list
  const handleSelect = (currentValue: string) => {
    onChange(currentValue)
    setOpen(false)
    setValue(currentValue)
    setInputValue(currentValue)
  }

  // When user types and presses Enter
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      handleSelect(inputValue.trim())
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
      className={cn(className, "p-2 border-2 rounded-md bg-foreground ")}
      asChild>
        <button aria-expanded={open} type="button" className="w-full h-full flex items-center justify-between" onClick={() => setOpen(!open)}>
          <span className="text">{value}</span>
          <ChevronsUpDown className="ml-20 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(className, "bg-foreground-secondary rounded-sm focus:outline-none focus:ring focus:ring-slate-500")}>
        <Command>
          <CommandInput 
            placeholder={`Select a ${type}`}
            className="text-text"
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleInputKeyDown}
          />
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
                  onSelect={handleSelect}
                >
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
