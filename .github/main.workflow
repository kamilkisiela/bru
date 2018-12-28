workflow "Build, Test, and Publish" {
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

workflow "Publish on Tag" {
  on = "push"
  resolves = "Publish"
}

action "Tag" {
  uses = "actions/bin/filter@master"
  args = "tag v*"
}

action "Install to publish" {
  uses = "borales/actions-yarn@master"
  args = "install"
  needs = ["Tag"]
}

action "Publish" {
  uses = "actions/npm@master"
  needs = ["Install to publish"]
  args = "run release"
  secrets = ["NPM_AUTH_TOKEN"]
}
