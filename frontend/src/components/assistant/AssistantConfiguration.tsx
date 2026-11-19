import { Alert, Button, Card, Description, InputGroup, Label, ListBox, Select, TextArea, TextField } from '@heroui/react'
import { Cable, ClipboardCopy, Copy } from 'lucide-react'
import { useRef, useState } from 'react'

export interface ConfigurationProps {
  title: string
  modelHint: string
  keyHint: string
  setupHint: string
  balanceHint: string
  apiUrl: string
  apiUrlLabel: string
  copyLabel: string
  copyUrlLabel: string
  keyLabel: string
  copyKeyLabel: string
  keyPlaceholder: string
  copyConfigurationLabel: string
  modelLabel: string
  copyModelLabel: string
  modelPlaceholder: string
  models: string[]
  model: string | null
  retryModelsLabel: string
  projectKey: string
  preparing: boolean
  acquireLabel: string
  error: string
  changeModel: (model: string) => void
  loadModels: () => void
  acquireKey: () => void
  copy: (value: string) => Promise<boolean>
}

export function AssistantConfiguration(props: ConfigurationProps) {
  const [manual, setManual] = useState<{ value: string; label: string } | null>(null)
  const attempt = useRef(0)
  async function copy(value: string, label: string) {
    const request = ++attempt.current
    setManual(null)
    const copied = await props.copy(value)
    if (!copied && request === attempt.current) setManual({ value, label })
  }

  return (
    <Card className="sgm-assistant-panel sgm-configuration" aria-label={props.title}>
      <Card.Header className="sgm-configuration-header">
        <span className="sgm-section-icon" aria-hidden="true"><Cable /></span>
        <Card.Title>{props.title}</Card.Title>
        <Card.Description>{props.setupHint}</Card.Description>
      </Card.Header>
      <Card.Content className="sgm-configuration-fields">
        <div>
          <div className="sgm-model-row">
            <Select className="min-w-0 flex-1" value={props.model} onChange={(value) => { if (typeof value === 'string') props.changeModel(value) }} aria-describedby="sgm-model-hint" isDisabled={!props.models.length} placeholder={props.modelPlaceholder}>
              <Label>{props.modelLabel}</Label>
              <Select.Trigger className="!min-h-11 sgm-assistant-code">
                <Select.Value className="truncate" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="sgm-assistant-menu sgm-assistant-models">
                <ListBox items={props.models.map(id => ({ id }))}>
                  {({ id }) => <ListBox.Item id={id} textValue={id}>{id}<ListBox.ItemIndicator /></ListBox.Item>}
                </ListBox>
              </Select.Popover>
            </Select>
            <Button className="sgm-copy-button" variant="ghost" isDisabled={!props.model} aria-label={props.copyModelLabel} onPress={() => { if (props.model) void copy(props.model, props.copyModelLabel) }}><Copy aria-hidden="true" />{props.copyLabel}</Button>
          </div>
          <Description id="sgm-model-hint">{props.modelHint}</Description>
        </div>
        {props.retryModelsLabel && <Button className="!min-h-11 justify-self-start" variant="ghost" onPress={props.loadModels}>{props.retryModelsLabel}</Button>}
        <TextField className="min-w-0" isReadOnly value={props.apiUrl}>
          <Label>{props.apiUrlLabel}</Label>
          <InputGroup className="min-w-0 w-full">
            <InputGroup.Input className="!min-h-11 !w-0 min-w-0 sgm-assistant-code" />
            <InputGroup.Suffix>
              <Button size="sm" variant="ghost" className="sgm-copy-button" aria-label={props.copyUrlLabel} onPress={() => copy(props.apiUrl, props.copyUrlLabel)}><Copy aria-hidden="true" />{props.copyLabel}</Button>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>
        <TextField className="min-w-0" isReadOnly value={props.projectKey}>
          <Label>{props.keyLabel}</Label>
          <InputGroup className="min-w-0 w-full">
            {props.projectKey ? (
              <InputGroup.TextArea className="sgm-assistant-code sgm-assistant-key !min-h-11 min-w-0" rows={1} spellCheck={false} autoComplete="off" />
            ) : (
              <InputGroup.Input className="!min-h-11 !w-0 min-w-0" placeholder={props.keyPlaceholder} />
            )}
            <InputGroup.Suffix>
              {props.projectKey ? (
                <Button size="sm" variant="ghost" className="sgm-copy-button" aria-label={props.copyKeyLabel} onPress={() => copy(props.projectKey, props.copyKeyLabel)}><Copy aria-hidden="true" />{props.copyLabel}</Button>
              ) : (
                <Button size="sm" className="!min-h-11" isPending={props.preparing} onPress={props.acquireKey}>{props.acquireLabel}</Button>
              )}
            </InputGroup.Suffix>
          </InputGroup>
          <Description>{props.keyHint}</Description>
        </TextField>
        {manual && <TextArea autoFocus rows={manual.value.includes('\n') ? 3 : 2} readOnly aria-label={manual.label} value={manual.value} onFocus={event => event.currentTarget.select()} />}
        {props.error && (
          <Alert status="warning">
            <Alert.Content>
              <Alert.Description>{props.error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </Card.Content>
      {(props.projectKey && props.model) ? (
        <Card.Footer className="sgm-configuration-footer">
          <Button variant="secondary" className="sgm-copy-all" onPress={() => copy([
            props.apiUrlLabel + ': ' + props.apiUrl,
            props.keyLabel + ': ' + props.projectKey,
            props.modelLabel + ': ' + props.model,
          ].join('\n'), props.copyConfigurationLabel)}>
            <ClipboardCopy aria-hidden="true" />{props.copyConfigurationLabel}
          </Button>
        </Card.Footer>
      ) : props.balanceHint && (
        <Card.Footer><p className="text-sm text-muted">{props.balanceHint}</p></Card.Footer>
      )}
    </Card>
  )
}
