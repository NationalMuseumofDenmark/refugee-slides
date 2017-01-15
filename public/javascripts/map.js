const DEFAULT_DURATION = 1000;
const MAX_FOCUS_RADIUS = 50;
const COUNTRY_FOCUS_CLASS = 'country--focus';

function featureArrayBounds(features) {
  if(features.length > 0) {
    return features.reduce((result, feature) => {
      const bounds = d3.geo.bounds(feature);
      if(result === null) {
        return bounds;
      } else {
        return [[
          Math.max(bounds[0][0], result[0][0]),
          Math.max(bounds[0][1], result[0][1])
        ], [
          Math.min(bounds[1][0], result[1][0]),
          Math.min(bounds[1][1], result[1][1])
        ]];
      }
    }, null);
  } else {
    throw new Error('Expected an array of at least a single element');
  }
}

function boundsCenter(bounds) {
  return [
    (bounds[0][0] + bounds[0][1]) / 2,
    (bounds[1][0] + bounds[1][1]) / 2
  ];
}

class Map {

  constructor(element, options) {
    this.$element = $(element);
    this.options = options;
    this.parameters = {};

    const svg = d3.select(element);
    this.everything = svg.append('g')
      .attr('id', 'everything')
      .attr('class', 'everything');
    this.countries = this.everything.append('g').attr('id', 'countries');
    this.focusses = this.everything.append('g').attr('id', 'focusses');

    d3.json(options.worldMapUrl, (error, world) => {
      if (error) throw error;
      this.world = world;
      this.worldFeatureCollection = topojson.feature(this.world, this.world.objects.world);

      this.countries
        .selectAll('path')
        .data(this.worldFeatureCollection.features)
      .enter()
        .append('path')
        .attr('data-id', (feature) => {
          return feature.id;
        })
        .attr('class', 'country');
      // The map was loaded
      this.loaded();
    });
  }

  generateProjection() {
    const width = this.$element.width();
    const height = this.$element.height();

    // Let's use a single projection and use css transforms to pan and zoom
    this.projection = d3.geo.mercator()
      .translate([width / 2, height / 2])
      .center([0, 0])
      .rotate([0, 0])
      .scale(200);

    this.path = d3.geo.path().projection(this.projection);
  }

  show() {
    this.$element.removeClass('map--hidden');
  }

  hide() {
    this.$element.addClass('map--hidden');
  }

  loaded() {
    this.generateProjection();
    this.update();
  }

  resized() {
    this.generateProjection();
    this.update();
  }

  update(parameters, duration) {
    if(parameters) {
      this.parameters = parameters;
    }
    if(typeof(duration) === 'undefined') {
      duration = DEFAULT_DURATION;
    }

    const $counties = this.$element.find('.country');

    let focusses = [];
    let centerInWorld = [0, 0];
    let scale = 1;
    if(this.parameters.countriesInFocus) {
      // TODO: Determine scale, center and rotation from the list of countries
      focusses = this.parameters.countriesInFocus.map(accumulation => {
        return this.worldFeatureCollection.features
        .reduce((result, feature) => {
          if(feature.id === accumulation.code) {
            return {
              feature,
              significance: accumulation.significance,
              center: d3.geo.centroid(feature),
              id: feature.id,
              label: accumulation.label
            };
          }
          return result;
        }, null);
      });

      const focusBounds = featureArrayBounds(focusses.map(focus => {
        return focus.feature;
      }));

      // Update the countries in focus
      const contryIdsInFocus = focusses.map(focus => focus.id);
      const $countiesInFocus = $counties.filter((index, element) => {
        const id = $(element).data('id');
        return contryIdsInFocus.indexOf(id) >= 0;
      });
      const $countiesNotInFocus = $counties.not($countiesInFocus);

      console.log('$countiesInFocus', $countiesInFocus);
      $countiesInFocus.addClass(COUNTRY_FOCUS_CLASS);
      $countiesNotInFocus.removeClass(COUNTRY_FOCUS_CLASS);

      centerInWorld = boundsCenter(focusBounds);
      scale = 2;
    } else {
      // Remove the focus class from any country
      $counties.removeClass(COUNTRY_FOCUS_CLASS);
    }

    const width = this.$element.width();
    const height = this.$element.height();
    const centerInView = this.projection(centerInWorld);

    this.updateCountries(duration);
    this.updateFocusses(focusses, duration);
    const translateX = 0 - centerInView[0] * scale + width / 2;
    const translateY = 0 - centerInView[1] * scale + height / 2;
    this.updateTransform({
      translate: [translateX + 'px', translateY + 'px'],
      scale
    });
  }

  updateCountries(duration) {
    this.countries
      .selectAll('path')
      .transition()
        .duration(duration)
        .attr('d', this.path);
  }

  updateFocusses(focusses, duration) {
    const projection = this.projection;

    const focusUpdateSelection = this.focusses.selectAll('circle')
      .data(focusses, (focus) => {
        return focus.id;
      });

    focusUpdateSelection.transition()
      .duration(duration)
      .style('opacity', 1)
      .attr('cx', (focus) => {
        const center = projection(focus.center);
        return center[0];
      })
      .attr('cy', (focus) => {
        const center = projection(focus.center);
        return center[1];
      })
      .attr('r', (focus) => {
        return focus.significance * MAX_FOCUS_RADIUS;
      });

    // When enter we append a circle
    focusUpdateSelection.enter()
      .append('circle')
      .attr('class', 'focusses__focus')
      .attr('r', 0)
      .attr('cx', (focus) => {
        const center = projection(focus.center);
        return center[0];
      })
      .attr('cy', (focus) => {
        const center = projection(focus.center);
        return center[1];
      })
      .style('opacity', 0)
      .transition()
        .duration(duration)
        .style('opacity', 1)
        .attr('r', (focus) => {
          return focus.significance * MAX_FOCUS_RADIUS;
        });

    // When exit we remove the circle
    focusUpdateSelection.exit()
      .transition()
        .duration(duration)
        .style('opacity', 0)
        .remove();
  }

  updateTransform(options) {
    const transform = Object.keys(options).map(key => {
      let values = options[key];
      // If a single value is given, wrap it in an array
      if(!Array.isArray(values)) {
        values = [values];
      }
      return key + '(' + values.join(',') + ')';
    }).join(' ');
    const $everything = $(this.everything.node());
    $everything.css('transform', transform);
  }

}

module.exports = Map;
