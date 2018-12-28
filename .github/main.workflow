workflow "Build, Test, and Publish" {
  on = "push"
  resolves = ["Publish"]
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

# Filter for master branch
action "Tag" {
  needs = "Test"
  uses = "actions/bin/filter@master"
  args = "tag v*"
}

action "Publish" {
  uses = "actions/npm@master"
  args = "publish --access public"
  secrets = ["NPM_AUTH_TOKEN"]
  needs = ["Tag"]
}
