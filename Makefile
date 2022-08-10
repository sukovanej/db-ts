.PHONY: rm-dist

clean:
	find packages -name 'dist' | xargs rm -rf
	find packages -name '*.js' | xargs rm
