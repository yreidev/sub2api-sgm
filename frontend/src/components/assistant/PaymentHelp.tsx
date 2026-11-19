import { Button, Card, Modal, Typography } from '@heroui/react'

export function PaymentHelp(props: { sanitizedHtml: string; imageUrl?: string; imageLabel: string; closeLabel: string }) {
  return (
    <Card className="sgm-assistant-panel">
      <Card.Content>
        {props.imageUrl && (
          <Modal>
            <Button variant="outline" className="!min-h-12 !h-auto !whitespace-normal">
              <img alt="" className="size-10 shrink-0 object-contain" src={props.imageUrl} />
              {props.imageLabel}
            </Button>
            <Modal.Backdrop>
              <Modal.Container scroll="inside">
                <Modal.Dialog className="sgm-assistant-overview sgm-recharge-dialog">
                  <Modal.Header>
                    <Modal.Heading>{props.imageLabel}</Modal.Heading>
                    <Button slot="close" size="sm" variant="ghost" className="!min-h-11">{props.closeLabel}</Button>
                  </Modal.Header>
                  <Modal.Body><img alt={props.imageLabel} className="mx-auto max-h-[75dvh] max-w-full object-contain" src={props.imageUrl} /></Modal.Body>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        )}
        {props.sanitizedHtml && <Typography.Prose><div className="markdown-body" dangerouslySetInnerHTML={{ __html: props.sanitizedHtml }} /></Typography.Prose>}
      </Card.Content>
    </Card>
  )
}
