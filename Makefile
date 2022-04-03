.PHONY: rm-dist

rm-dist:
	find packages -name 'dist' | xargs rm -rf
