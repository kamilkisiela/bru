workflow "Build, Test, and Publish" {
  on = "push"
  resolves = ["Test", "Publish"]
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

action "Publish" {
  uses = "actions/npm@master"
  needs = ["Tag", "Install"]
  args = "run release"
  secrets = ["NPM_AUTH_TOKEN"]
}
