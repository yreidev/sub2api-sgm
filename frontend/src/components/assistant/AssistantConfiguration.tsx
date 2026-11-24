import { Alert, Button, Card, Description, InputGroup, Label, ListBox, Select, TextArea, TextField } from '@heroui/react'
import { Cable, Check, ClipboardCopy, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface ConfigurationProps {
  title: string
  modelHint: string
  keyHint: string
  setupHint: string
  balanceHint: string
  apiUrl: string
  apiUrlLabel: string
  copyLabel: string
  copiedLabel?: string
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

type CopyTarget = 'model' | 'url' | 'key' | 'all'

export function AssistantConfiguration(props: ConfigurationProps) {
  const [manual, setManual] = useState<{ value: string; label: string } | null>(null)
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null)
  const attempt = useRef(0)
  const resetTimer = useRef<number | null>(null)

  useEffect(() => () => {
    attempt.current += 1
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current)
      resetTimer.current = null
    }
  }, [])

  async function copy(target: CopyTarget, value: string, label: string) {
    const request = ++attempt.current
    setManual(null)
    const copied = await props.copy(value)
    if (request !== attempt.current) return
    if (copied) {
      setCopiedTarget(target)
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => {
        setCopiedTarget(current => (current === target ? null : current))
        resetTimer.current = null
      }, 1800)
      return
    }
    setCopiedTarget(null)
    setManual({ value, label })
  }

  const copiedText = props.copiedLabel || props.copyLabel
  const copiedAnnouncement = copiedTarget === null
    ? ''
    : copiedTarget === 'model'
      ? `${copiedText}: ${props.model ?? props.modelLabel}`
      : copiedTarget === 'url'
        ? `${copiedText}: ${props.apiUrlLabel}`
        : copiedTarget === 'key'
          ? `${copiedText}: ${props.keyLabel}`
          : `${copiedText}: ${props.copyConfigurationLabel}`

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
            <Button
              className="sgm-copy-button"
              variant="ghost"
              data-copied={copiedTarget === 'model' || undefined}
              isDisabled={!props.model}
              aria-label={props.copyModelLabel}
              onPress={() => { if (props.model) void copy('model', props.model, props.copyModelLabel) }}
            >
              {copiedTarget === 'model' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copiedTarget === 'model' ? copiedText : props.copyLabel}
            </Button>
          </div>
          <Description id="sgm-model-hint">{props.modelHint}</Description>
        </div>
        {props.retryModelsLabel && <Button className="sgm-retry-button !min-h-11 justify-self-start" variant="ghost" onPress={props.loadModels}>{props.retryModelsLabel}</Button>}
        <TextField className="min-w-0" isReadOnly value={props.apiUrl}>
          <Label>{props.apiUrlLabel}</Label>
          <InputGroup className="min-w-0 w-full">
            <InputGroup.Input className="!min-h-11 !w-0 min-w-0 sgm-assistant-code" />
            <InputGroup.Suffix>
              <Button
                size="sm"
                variant="ghost"
                className="sgm-copy-button"
                data-copied={copiedTarget === 'url' || undefined}
                aria-label={props.copyUrlLabel}
                onPress={() => copy('url', props.apiUrl, props.copyUrlLabel)}
              >
                {copiedTarget === 'url' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copiedTarget === 'url' ? copiedText : props.copyLabel}
              </Button>
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
                <Button
                  size="sm"
                  variant="ghost"
                  className="sgm-copy-button"
                  data-copied={copiedTarget === 'key' || undefined}
                  aria-label={props.copyKeyLabel}
                  onPress={() => copy('key', props.projectKey, props.copyKeyLabel)}
                >
                  {copiedTarget === 'key' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copiedTarget === 'key' ? copiedText : props.copyLabel}
                </Button>
              ) : (
                <Button size="sm" variant="primary" className="sgm-acquire-button !min-h-11" isPending={props.preparing} onPress={props.acquireKey}>{props.acquireLabel}</Button>
              )}
            </InputGroup.Suffix>
          </InputGroup>
          <Description>{props.keyHint}</Description>
        </TextField>
        {manual && <TextArea autoFocus className="sgm-manual-copy sgm-assistant-code" rows={manual.value.includes('\n') ? 3 : 2} readOnly aria-label={manual.label} value={manual.value} onFocus={event => event.currentTarget.select()} />}
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
          <Button
            variant="secondary"
            className="sgm-copy-all"
            data-copied={copiedTarget === 'all' || undefined}
            aria-label={props.copyConfigurationLabel}
            onPress={() => copy('all', [
              props.apiUrlLabel + ': ' + props.apiUrl,
              props.keyLabel + ': ' + props.projectKey,
              props.modelLabel + ': ' + props.model,
            ].join('\n'), props.copyConfigurationLabel)}
          >
            {copiedTarget === 'all' ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
            {copiedTarget === 'all' ? (props.copiedLabel || props.copyConfigurationLabel) : props.copyConfigurationLabel}
          </Button>
        </Card.Footer>
      ) : props.balanceHint && (
        <Card.Footer className="sgm-configuration-footer"><p className="sgm-configuration-hint">{props.balanceHint}</p></Card.Footer>
      )}
      <span className="sgm-sr-only" role="status" aria-live="polite">{copiedAnnouncement}</span>
    </Card>
  )
}
