.PHONY: rm-dist

clean:
	find packages -name 'dist' | xargs rm -rf
	find packages -name '*.js' | xargs rm
	find packages -name 'tsconfig.tsbuildinfo' | xargs rm

format:
	yarn lint:fix
