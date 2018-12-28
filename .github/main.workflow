workflow "Build, Test, and Publish" {
  on = "push"
  resolves = [
    "Test",
    "Release",
  ]
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
  needs = ["Install"]
  args = "tag v*"
}

action "Release" {
  uses = "actions/npm@master"
  needs = ["Tag"]
  args = "run release"
  secrets = ["NPM_AUTH_TOKEN"]
}