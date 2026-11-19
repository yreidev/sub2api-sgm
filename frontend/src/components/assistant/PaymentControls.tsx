import { Button, Chip, FieldError, InputGroup, Label, TextField, ToggleButton } from '@heroui/react'

export interface PaymentControlProps {
  label: string
  detail?: string
  badge?: string
  icon?: string
  selected?: boolean
  disabled?: boolean
  primary?: boolean
  amount?: string
  currency?: string
  placeholder?: string
  error?: string
  onPress: () => void
  onInput: (value: string) => void
}

export function PaymentControl(props: PaymentControlProps) {
  if (props.amount !== undefined) {
    return (
      <TextField className="min-w-0" value={props.amount} onChange={props.onInput} isInvalid={!!props.error} validationBehavior="aria">
        <Label>{props.label}</Label>
        <InputGroup className="w-full min-w-0">
          <InputGroup.Input className="!min-h-12 !w-0 min-w-0 flex-1" inputMode="decimal" placeholder={props.placeholder} />
          <InputGroup.Suffix>{props.currency}</InputGroup.Suffix>
        </InputGroup>
        {props.error && <FieldError>{props.error}</FieldError>}
      </TextField>
    )
  }
  if (props.selected !== undefined) {
    return (
      <ToggleButton className="sgm-payment-choice" isSelected={props.selected} isDisabled={props.disabled} onPress={props.onPress}>
        {props.icon && <img alt="" className="size-6 shrink-0" src={props.icon} />}
        <span className="sgm-choice-content">
          <span className="sgm-choice-heading">
            <span className="sgm-choice-label">{props.label}{props.currency && <small> {props.currency}</small>}</span>
            {props.badge && <Chip size="sm" variant="soft" color="success">{props.badge}</Chip>}
          </span>
          {props.detail && <span className="sgm-choice-detail">{props.detail}</span>}
        </span>
      </ToggleButton>
    )
  }
  return (
    <Button className="!min-h-12 !h-auto !w-full !whitespace-normal" variant={props.primary ? 'primary' : 'outline'} isDisabled={props.disabled} onPress={props.onPress}>
      {props.label}
    </Button>
  )
}
