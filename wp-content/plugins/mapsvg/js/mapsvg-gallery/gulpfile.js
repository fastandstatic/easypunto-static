var gulp = require("gulp"),
    uglify = require("gulp-uglify"),
    concat = require("gulp-concat"),
    cleanCSS = require("gulp-clean-css"),
    argv = require("yargs").argv,
    zip = require("gulp-zip"),
    replace = require("gulp-replace"),
    rename = require("gulp-rename"),
    gutil = require("gulp-util"),
    gulpif = require("gulp-if"),
    prompt = require("gulp-prompt"),
    rsync = require("gulp-rsync"),
    exec = require("child_process").exec,
    upload = require("gulp-file-post"),
    bump = require("gulp-bump");

gulp.task("gallery_zip", function () {
    var version = argv.ver;
    return gulp
        .src(["./**", "!./{node_modules,node_modules/**}"], { base: "../" })
        .pipe(zip("wp.mapsvg-gallery-" + version + ".zip"))
        .pipe(gulp.dest("../"));
});

gulp.task(
    "gallery",
    gulp.series(
        gulp.parallel(
            function () {
                return gulp
                    .src([
                        "./js/photoswipe.min.js",
                        "./js/photoswipe-ui-default.min.js",
                        "./js/mapsvg-gallery.js",
                        "./js/jquery.justifiedGallery.min.js",
                        "./js/slick.min.js",
                    ])
                    .pipe(uglify())
                    .pipe(concat("mapsvg-gallery-front.min.js"))
                    .pipe(gulp.dest("./dist"));
            },
            function () {
                return gulp
                    .src([
                        "./css/photoswipe.css",
                        "./css/default-skin/default-skin.css",
                        "./css/justifiedGallery.min.css",
                        "./css/slick.css",
                        "./css/slick-theme.css",
                        "./css/mapsvg-gallery.css",
                    ])
                    .pipe(cleanCSS())
                    .pipe(concat("mapsvg-gallery-full.min.css"))
                    .pipe(gulp.dest("./dist"));
            },
            function () {
                return gulp
                    .src(["./css/default-skin/*", "!./css/default-skin/*.css"])
                    .pipe(gulp.dest("./dist"));
            },
            function () {
                return gulp
                    .src([
                        "./js/mapsvg-gallery.js",
                        "./js/gallery-controller.js",
                        "./js/gallery-list-controller.js",
                    ])
                    .pipe(uglify())
                    .pipe(concat("mapsvg-gallery-admin.min.js"))
                    .pipe(gulp.dest("./dist"));
            }
        ),
        gulp.parallel(
            function () {
                return gulp.src(["./css/**"]).pipe(gulp.dest("./css"));
            },
            function () {
                return gulp.src(["./js/**"]).pipe(gulp.dest("./js"));
            },
            function () {
                return gulp.src(["./dist/**"]).pipe(gulp.dest("./dist"));
            },
            function () {
                var version = argv.ver;

                return gulp
                    .src(["./mapsvg-gallery.php"])
                    .pipe(replace(/Version: \d+(\.\d+){0,2}/g, "Version: " + version))
                    .pipe(
                        replace(
                            /'MAPSVG_GAL_VERSION', '\d+(\.\d+){0,2}/g,
                            "'MAPSVG_GAL_VERSION', '" + version
                        )
                    )
                    .pipe(gulp.dest("./"));
            }
        ),
        "gallery_zip"
    )
);
