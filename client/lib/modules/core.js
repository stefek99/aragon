// @flow
import { ReactiveVar } from 'meteor/reactive-var'
import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'

class Core {
  modulesVar: ReactiveVar
  modules: Array

  constructor(modules = []) {
    Core.setup()

    this.modulesVar = new ReactiveVar([])
    this.modules = modules
  }

  get modules() {
    return this.modulesVar.get()
  }

  set modules(newModules: Array) {
    this.modulesVar.set(newModules)
    this.setupRoutes()
  }

  setupRoutes() {
    this.modules
      .map(module => (module.route))
      .forEach((route) => {
        FlowRouter.route(`/${route.name}/*`, route)
        FlowRouter.route(`/${route.name}`, route)
      })
  }

  static setup() {
    BlazeLayout.setRoot('body')
    FlowRouter.notFound = {
      action: () => FlowRouter.go('home'),
    }
  }
}

export default Core
