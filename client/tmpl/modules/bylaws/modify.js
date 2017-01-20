// @flow
import { Template } from 'meteor/templating'
import { TemplateVar } from 'meteor/frozeman:template-var'
import { FlowRouter } from 'meteor/kadira:flow-router'

import { dispatcher, actions } from '/client/lib/action-dispatcher'
import { bylawForAction } from '/client/lib/action-dispatcher/bylaws'
import Status from '/client/lib/identity/status'
import ClosableSection from '/client/tmpl/components/closableSection'

const tmpl = Template.Module_Bylaws_Modify.extend([ClosableSection])

const triggerList = [
  'voting',
  'status',
  'specialStatus',
]

const setAction = () => {
  const action = actions[FlowRouter.getParam('key')]
  const completeAction = Object.assign(action, { bylaw: bylawForAction(action) })
  TemplateVar.set('action', completeAction)
  TemplateVar.set('selectedTrigger', triggerList[completeAction.bylaw.type])
}

tmpl.onCreated(setAction)

const save = function () {
  const signature = TemplateVar.get(this, 'action').signature
  const trigger = TemplateVar.get(this, 'selectedTrigger')
  if (trigger === 'status') {
    const statusIndex: number = Status.toNumber(this.$('[name="status"]').val())
    dispatcher.dispatch(actions.addStatusBylaw, signature, statusIndex)
  } else if (trigger === 'specialStatus') {
    dispatcher.dispatch(actions.addSpecialStatusBylaw, signature, 0)
  } else if (trigger === 'voting') {
    const supportNeeded = this.$('[name="supportNeeded"]').val()
    const closingRelativeMajority = this.$('[name="supportNeeded"]').is(':checked')
    const minimumVotingTime = parseInt(this.$('[name="minimumVotingTime"]').val(), 10) * 60 * 60 * 24
    dispatcher.dispatch(actions.addVotingBylaw, signature, supportNeeded, 100,
                        closingRelativeMajority, minimumVotingTime, 0)
  }
}

const confirmText =
`Changing your company's bylaws has real implications on its functioning.\n
Please make sure this is a desired action.\n
A voting will be created and 90% of the voting power will be needed in order to confirm the change.\n`

tmpl.onRendered(function () {
  this.$('.form').form({
    onSuccess: (e) => {
      e.preventDefault()
      if (confirm(confirmText)) save.call(this)
      return false
    },
  })

  const setStatusDropdown = () => {
    this.$('#status').dropdown()
  }

  const setVotingForm = () => {
    this.$('#closingRelativeMajority').checkbox()
  }

  const setTriggerDropdown = () => {
    this.$('#trigger').dropdown({
      onChange: (v) => {
        TemplateVar.set(this, 'selectedTrigger', v)
        requestAnimationFrame(() => {
          setStatusDropdown()
          setVotingForm()
        })
      },
    })
  }

  this.autorun(() => {
    FlowRouter.watchPathChange()
    setAction()
    requestAnimationFrame(() => {
      setTriggerDropdown()
      setStatusDropdown()
      setVotingForm()
    })
  })
})

tmpl.helpers({
  triggers: (action) => ([{
    title: 'Requires a voting',
    value: 'voting',
    disabled: (action.key === 'beginPoll' || action.key === 'castVote') ? 'disabled' : null,
  }, {
    title: 'Requires a user with status',
    value: 'status',
  }, {
    title: 'Requires a shareholder',
    value: 'specialStatus',
  }]),
  triggerToInt: (trigger: string) => triggerList.indexOf(trigger),
  intToTrigger: (trigger: number) => triggerList[trigger],
  statuses: [{
    value: 'none',
    title: 'Everyone will be able to change it',
  }, {
    value: 'employee',
    title: 'Employees and executives will be able to change it',
  }, {
    value: 'executive',
    title: 'Executives will be able to change it',
  }],
  statusToInt: status => Status.toNumber(status),
  action: () => TemplateVar.get('action'),
  selectedTrigger: () => TemplateVar.get('selectedTrigger'),
  secondsToDays: (seconds: number): number => seconds / 60 / 60 / 24,
  numbersToPercentage: (a: number, b: number): number => Math.round((a / b) * 100),
})
