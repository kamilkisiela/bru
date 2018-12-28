workflow "Release" {
  on = "push"
  resolves = ["Filters for GitHub Actions"]
}

action "GitHub Action for npm" {
  uses = "actions/npm@e7aaefe"
  secrets = ["NPM_AUTH_TOKEN"]
}

action "Filters for GitHub Actions" {
  uses = "actions/bin/filter@b2bea07"
  needs = ["GitHub Action for npm"]
}
