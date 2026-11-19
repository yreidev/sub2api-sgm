import { Button, Card, Input, Label, ListBox, Select, TextField } from '@heroui/react'
import { Search, X } from 'lucide-react'
import { useRef } from 'react'

interface Filter<Value extends string | number> {
  label: string
  value: Value
  options: { id: Value; label: string; disabled?: boolean }[]
  change: (value: Value) => void
}

function FilterSelect<Value extends string | number>({ label, value, options, change }: Filter<Value>) {
  // The native select used for autofill reports string keys, including for numeric group IDs and rates.
  return (
    <Select value={String(value)} disabledKeys={options.filter(option => option.disabled).map(option => String(option.id))}
      onChange={key => {
        const option = options.find(item => String(item.id) === key)
        if (option && !option.disabled) change(option.id)
      }}>
      <Label>{label}</Label>
      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
      <Select.Popover className="public-menu public-palette">
        <ListBox>
          {options.map(option => (
            <ListBox.Item key={option.id} id={String(option.id)} textValue={option.label}>
              {option.label}<ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}

export function PlazaFilters(props: {
  search: string; changeSearch: (value: string) => void
  modelLabel: string; placeholder: string; clearLabel: string
  platform: Filter<string>; group: Filter<number | 'all'>; rate: Filter<number | 'all'>
}) {
  const input = useRef<HTMLInputElement>(null)
  return <Card className="plaza-filters">
    <TextField value={props.search} onChange={props.changeSearch}>
      <Label>{props.modelLabel}</Label>
      <div className="search-box">
        <Search size={16} aria-hidden="true" />
        <Input id="plaza-model-search" ref={input} placeholder={props.placeholder} />
        {props.search && <Button isIconOnly variant="ghost" aria-label={props.clearLabel}
          onPress={() => { props.changeSearch(''); input.current?.focus() }}><X size={16} /></Button>}
      </div>
    </TextField>
    <FilterSelect {...props.platform} />
    <FilterSelect {...props.group} />
    <FilterSelect {...props.rate} />
  </Card>
}
