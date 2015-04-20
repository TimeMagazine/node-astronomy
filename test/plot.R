PATH <- "/path/to/test/directory/"

mercury = read.csv(paste(PATH, "test/mercury.csv", sep=""))
venus = read.csv(paste(PATH, "test/venus.csv", sep=""))
earth = read.csv(paste(PATH, "test/earth.csv", sep=""))
mars = read.csv(paste(PATH, "test/mars.csv", sep=""))
halley = read.csv(paste(PATH, "test/halley.csv", sep=""))

png(paste(PATH, "test/inner_solar_system.png", sep=""))
plot(0, 0, type="p", col="yellow", pch=16, cex=4, xlim=c(-400, 400), ylim=c(-400, 400), xaxt='n', yaxt='n', ann=FALSE)
lines(mars$x, mars$y, type="l", col="red")
lines(mercury$x, mercury$y, type="l", col="orange")
lines(venus$x, venus $y, type="l", col="green")
lines(earth$x, earth$y, type="l", col="blue")
lines(halley$x, halley$y, type="l", col="gray")

dev.off()