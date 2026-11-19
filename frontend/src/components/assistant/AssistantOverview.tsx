import { Button, Card, Dropdown, Label, Modal, Surface, Typography } from '@heroui/react'
import { ChevronDown, CircleUserRound, Plus, RefreshCw, Wallet, X } from 'lucide-react'
import type { Ref } from 'react'

interface OverviewProps {
  title: string
  siteName: string
  siteLogo: string
  accountLabel: string
  adminLabel: string
  logoutLabel: string
  balanceLabel: string
  balance: string
  refreshLabel: string
  rechargeLabel: string
  contactAdmin: string
  showRecharge: boolean
  rechargeOpen: boolean
  refreshing: boolean
  refreshBalance: () => void
  setRechargeOpen: (open: boolean) => void
  closeLabel: string
  openAdmin?: () => void
  logout: () => void
  paymentHost: Ref<HTMLDivElement>
  usageHost: Ref<HTMLDivElement>
  configurationHost: Ref<HTMLDivElement>
}

export function AssistantOverview(props: OverviewProps) {
  return (
    <Surface className="sgm-assistant-overview sgm-workspace">
      <header className="sgm-assistant-header">
        <div className="sgm-page-width sgm-navigation">
          <div className="sgm-wordmark">
            <img alt="" src={props.siteLogo} />
            <span>{props.siteName}</span>
          </div>
          <Dropdown>
            <Button className="sgm-account-button" variant="ghost">
              <CircleUserRound aria-hidden="true" />{props.accountLabel}<ChevronDown aria-hidden="true" />
            </Button>
            <Dropdown.Popover className="sgm-assistant-menu" placement="bottom end">
              <Dropdown.Menu>
                {props.openAdmin && <Dropdown.Item id="admin" onAction={props.openAdmin}><Label>{props.adminLabel}</Label></Dropdown.Item>}
                <Dropdown.Item id="logout" onAction={props.logout}><Label>{props.logoutLabel}</Label></Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </header>
      <main className="sgm-page-width sgm-dashboard">
        <Typography.Heading level={1} className="sgm-page-title">{props.title}</Typography.Heading>
        <Card className="sgm-balance-card" aria-label={props.balanceLabel}>
          <div aria-hidden="true" className="sgm-balance-engraving" />
          <Card.Header>
            <Card.Title className="sgm-balance-label"><Wallet aria-hidden="true" />{props.balanceLabel}</Card.Title>
          </Card.Header>
          <Card.Content>
            <Typography.Paragraph className="sgm-assistant-amount" aria-live="polite">{props.balance}</Typography.Paragraph>
          </Card.Content>
          <Card.Footer className="sgm-balance-actions">
            {props.showRecharge ? (
              <Button className="sgm-main-action" variant="primary" aria-haspopup="dialog" aria-expanded={props.rechargeOpen} onPress={() => props.setRechargeOpen(true)}>
                <Plus aria-hidden="true" />{props.rechargeLabel}
              </Button>
            ) : props.contactAdmin && <p>{props.contactAdmin}</p>}
            <Button variant="ghost" isPending={props.refreshing} onPress={props.refreshBalance}>
              <RefreshCw aria-hidden="true" />{props.refreshLabel}
            </Button>
          </Card.Footer>
        </Card>
        <div ref={props.configurationHost} className="min-w-0" />
        <Card className="sgm-assistant-panel sgm-usage-card" aria-labelledby="assistant-usage-title">
          <Card.Content><div ref={props.usageHost} /></Card.Content>
        </Card>
      </main>
      <Modal.Backdrop className="sgm-recharge-backdrop" isOpen={props.rechargeOpen} onOpenChange={props.setRechargeOpen}>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="sgm-assistant-overview sgm-recharge-dialog" id="assistant-recharge">
            <Modal.Header>
              <Modal.Heading><Wallet aria-hidden="true" />{props.rechargeLabel}</Modal.Heading>
              <Button slot="close" size="sm" variant="ghost" className="!min-h-11" aria-label={props.closeLabel}><X aria-hidden="true" />{props.closeLabel}</Button>
            </Modal.Header>
            <Modal.Body><div ref={props.paymentHost} /></Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Surface>
  )
}
