import { Button, Card, Modal, Typography } from '@heroui/react'

export function PaymentHelp(props: { sanitizedHtml: string; imageUrl?: string; imageLabel: string; closeLabel: string }) {
  return (
    <Card className="sgm-assistant-panel sgm-payment-help">
      <Card.Content className="grid gap-3">
        {props.imageUrl && (
          <Modal>
            <Button variant="outline" className="sgm-payment-help-trigger !min-h-12 !h-auto justify-start gap-3 px-3 py-2 text-start !whitespace-normal">
              <img
                alt=""
                className="size-10 shrink-0 rounded-md border border-[var(--border,#d4e0e2)] bg-[var(--panel-subtle,#f7fafa)] p-0.5 object-contain"
                src={props.imageUrl}
              />
              <span className="text-sm font-medium">{props.imageLabel}</span>
            </Button>
            <Modal.Backdrop className="sgm-recharge-backdrop">
              <Modal.Container scroll="inside">
                <Modal.Dialog className="sgm-assistant-overview sgm-recharge-dialog">
                  <Modal.Header>
                    <Modal.Heading>{props.imageLabel}</Modal.Heading>
                    <Button slot="close" size="sm" variant="ghost" className="!min-h-11">{props.closeLabel}</Button>
                  </Modal.Header>
                  <Modal.Body>
                    <img
                      alt={props.imageLabel}
                      className="mx-auto max-h-[75dvh] max-w-full rounded-xl border border-[var(--line-subtle,#e4ecee)] bg-[var(--panel-subtle,#f7fafa)] p-1 object-contain"
                      src={props.imageUrl}
                    />
                  </Modal.Body>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        )}
        {props.sanitizedHtml && (
          <Typography.Prose className="min-w-0">
            <div className="markdown-body text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: props.sanitizedHtml }} />
          </Typography.Prose>
        )}
      </Card.Content>
    </Card>
  )
}
