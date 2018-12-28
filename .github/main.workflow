workflow "Build and Test" {
  on = "push"
  resolves = "Test"
}

action "Install" {
  uses = "borales/actions-yarn@master"
  args = "install"
}

action "Build" {
  needs = "Install"
  uses = "borales/actions-yarn@master"
  args = "build"
}

action "Examples" {
  needs = "Build"
  uses = "borales/actions-yarn@master"
  args = "examples"
}

action "Test" {
  needs = "Examples"
  uses = "borales/actions-yarn@master"
  args = "test"
}

action "Tag" {
  uses = "actions/bin/filter@master"
  args = "tag v*"
}

action "Install to release" {
  uses = "borales/actions-yarn@master"
  args = "install"
  needs = "Tag"
}

action "Release" {
  uses = "actions/npm@master"
  needs = "Install to release"
  args = "run release"
  secrets = ["NPM_AUTH_TOKEN"]
}

workflow "Publish" {
  on = "push"
  resolves = ["Release"]
}
