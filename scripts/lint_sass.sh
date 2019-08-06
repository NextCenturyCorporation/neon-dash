#!/bin/sh
npx sass-lint-auto-fix --config sass-lint-auto-fix.yaml --config-sass-lint .sass-lint.yml
npx sass-lint --config .sass-lint.yml -v