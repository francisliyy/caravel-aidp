const $ = require('jquery');
const echarts = require('echarts');

function Ec3BarLineWidget(slice) {

  function getDefaultOptions(vizType, options) {
    let chart_options = {};
    if (options) {
      chart_options = eval('(' + options + ')');
    }
    switch (vizType) {
      case 'ec3_bar':
        if (!chart_options.xAxis){
          chart_options.xAxis = [{type: 'category'}];
        }
        if (!chart_options.yAxis){
          chart_options.yAxis = [{type: 'value'}];
        }
        if (!chart_options.series){
          chart_options.series = [{
            type: 'bar'
          }]
        }
        break;
      case 'ec3_line':
        if (!chart_options.xAxis){
          chart_options.xAxis = [{type: 'category'}];
        }
        if (!chart_options.yAxis){
          chart_options.yAxis = [{type: 'value'}];
        }
        if (!chart_options.series){
          chart_options.series = [{
            type: 'line'
          }];
        }
        break;
      case 'ec3_pie':
        if (!chart_options.series) {
          chart_options.series = [{
            type: 'pie'
          }];
        }
        if (!chart_options.legend) {
          chart_options.legend = {};
        }
        break;
      case 'ec3_map':
        if (!chart_options.series) {
          chart_options.series = [{
            type: 'map'
          }];
        }
        break;
    }
    return chart_options;
  }

  function getSymbolRotate(direction){
    switch (direction) {
      case 'n':
        return 0;
      case 'e':
        return 90;
      case 's':
        return 180;
      case 'w':
        return 270;
    }
  }

  function uniqueArray(arr) {
    let result = [],
        len = arr.length,
        item, i;
    for (i = 0; i < len; i++) {
        item = arr[i];
        if (result.indexOf(item) === -1) {
            result.push(item);
        }
    }
    return result;
  }

  function getSerieData(params){
    //init seria data
    // records, x_col, metric_col, legend_col, legend, wind_direction_col
    let serie_data = [];
    if (!params.x_col && !params.legend_col) {
        return serie_data;
    } else {
      params.records.forEach((d) => {
      // if (!params.legend_col || 
        // (params.legend_col && params.legend && d[params.legend_col] == params.legend)) {
        
        if (params.legend_col && params.legend && d[params.legend_col] != params.legend){
          return;
        }

        let name = "";
        if (params.x_col) {
          name = d[params.x_col];
        } else if (params.legend_col) {
          name = d[params.legend_col];
        }
        
        let value = d[params.metric_col];
        let _item = {
          name,
          value
        };

        // add wind direction
        if (params.wind_direction_col != null && params.wind_direction_col != '') {
          _item['symbol'] = 'arrow';
          _item['symbolRotate'] = getSymbolRotate(d[params.wind_direction_col]);
        }
        serie_data.push(_item);
      // }
    });
    }
    
    return serie_data;
  }

  function getOptions(payload) {
    // get init echart_options
    let fd = payload.form_data;
    // let chart_options = {};
    let chart_options = getDefaultOptions(fd.viz_type, fd.aiec3_options);
    // if (fd.aiec3_options == '') {
    //   chart_options = getDefaultOptions(fd.viz_type);
    // } else {
    //   chart_options = eval('(' + fd.aiec3_options + ')');
    //   if (fd.viz_type != 'ec3_map' && !('xAxis' in chart_options)){
    //     chart_options.xAxis = [{type: 'category'}];
    //   }
    //   if (fd.viz_type != 'ec3_map' && !('yAxis' in chart_options)){
    //     chart_options.yAxis = [{type: 'value'}];
    //   }
    // }
    //add data to echart_options
    let legend_data = [];
    let xaxis_data = [];
    let option_series = [];

    // let dimension = "";
    //TODO support multi dimension
    // if ('dimensions' in fd && fd.dimensions != null && fd.dimensions.length > 0) {
    //   dimension = fd.dimensions[0];
    // }
    const column_mapping = payload.data.column_mapping;
    const metrics = fd.metrics.map((m) => {
      if (m in column_mapping) {
        return column_mapping[m];
      } else {
        return m;
      }
    });

    let x_col = fd.aiec3_x_col;
    if (fd.aiec3_x_col in column_mapping){
      x_col = column_mapping[fd.aiec3_x_col];
    }

    let legend_col = fd.aiec3_legend_col;
    if (fd.aiec3_legend_col in column_mapping) {
      legend_col = column_mapping[fd.aiec3_legend_col]
    }

    const order_by_cols = fd.order_by_cols;
    
    let wind_direction_col = column_mapping[fd.ec3_wind_direction_col];
    if (fd.ec3_wind_direction_col in column_mapping) {
      wind_direction_col = column_mapping[fd.ec3_wind_direction_col]
    }

    //init data
    if (x_col != '') {
      payload.data.records.forEach((d) => {
        // legend_data.push(d[dimension]);
        xaxis_data.push(d[x_col]);
      });
      xaxis_data = uniqueArray(xaxis_data);
    }

    //get default_serie
    // let default_serie = {};
    // if (chart_options.series.length == 1) {
    //   Object.assign(default_serie, chart_options.series[0]) 
    // }
    //init series data
    // if (chart_options.series.length <= 1) {
    if (!legend_col) {
      for (let i = 0; i < metrics.length; i++) {
        let metric = metrics[i];
        // if there is only one serie
        let default_serie = {};
        if (chart_options.series.length == 1) {
          Object.assign(default_serie, chart_options.series[0]) 
        } else {
          Object.assign(default_serie, chart_options.series[i]) 
        }

        let serie = Object.assign({}, default_serie);
        serie.name = metric;
        // add legend
        legend_data.push(metric);

        //init seria data
        // let serie_data = []
        // payload.data.records.forEach((d) => {
        //   let name = d[x_col];
        //   let value = d[metric];
        //   let _item = {
        //     name,
        //     value
        //   };
        //   // add wind direction
        //   if (wind_direction_col != null && wind_direction_col != '') {
        //     _item['symbol'] = 'arrow';
        //     _item['symbolRotate'] = getSymbolRotate(d[wind_direction_col]);
        //   }

        //   serie_data.push(_item);
        // });
        let serie_data = getSerieData({
          "records": payload.data.records,
          "x_col": x_col,
          "metric_col": metric,
          "legend_col": null,
          "legend": null,
          "wind_direction_col": null
        });

        serie.data = serie_data;
        option_series.push(serie);
        // chart_options.series[i] = serie;
      }
      
    } else {
      console.log('process option series with legend col: ' + payload.data.legends);
      legend_data = payload.data.legends;
      const metric = metrics[0];

      //TODO consider when the viz_type is pie
      if (fd.viz_type == 'ec3_pie') {
          let default_serie = {};
          Object.assign(default_serie, chart_options.series[0]) 
          let serie = Object.assign({}, default_serie);
          serie.name = x_col;
          let serie_data = getSerieData({
            "records": payload.data.records,
            "x_col": x_col,
            "metric_col": metric,
            "legend_col": legend_col,
            "legend": null,
            "wind_direction_col": wind_direction_col
          });
          serie.data = serie_data;
          option_series.push(serie);

      } else {
        for (let i = 0; i < legend_data.length; i++) {
          let legend = legend_data[i];
          let default_serie = {};
          if (chart_options.series.length == 1) {
            Object.assign(default_serie, chart_options.series[0]) 
          } else {
            Object.assign(default_serie, chart_options.series[i]) 
          }

          let serie = Object.assign({}, default_serie);
          serie.name = legend;

          let serie_data = getSerieData({
            "records": payload.data.records,
            "x_col": x_col,
            "metric_col": metric,
            "legend_col": legend_col,
            "legend": legend,
            "wind_direction_col": wind_direction_col
          });

          serie.data = serie_data;
          option_series.push(serie);
          // chart_options.series[i] = serie;
        }

      }
      
    }
    
    chart_options.series = option_series;

    if (!('legend' in chart_options)) {
      chart_options.legend = {};
    }
    chart_options.legend.data = legend_data;

    if (!('tooltip' in chart_options)){
      let tooltip = {};
      tooltip.trigger = 'axis';
      chart_options.tooltip = tooltip;
    }
       
    // if (!('data' in chart_options.legend && chart_options.legend.data.length > 0)) {
    //     chart_options.legend.data = legend_data;
    //   }

    if (xaxis_data != null && xaxis_data.length > 0) {
      if (chart_options.xAxis&&chart_options.xAxis[0].type == 'category') {
        chart_options.xAxis[0].data = xaxis_data;
      } else if (chart_options.yAxis&&chart_options.yAxis[0].type == 'category') {
        chart_options.yAxis[0].data = xaxis_data;
      }
    }

    // if ('xAxis' in chart_options) {
    //   //TODO consider more than one
    //   if (!('data' in chart_options.xAxis[0] && chart_options.xAxis[0].data > 0)) {
    //     chart_options.xAxis[0].data = xaxis_data;
    //   }
    // }

    console.log('chart_options: \n' + JSON.stringify(chart_options));
    return chart_options;
  }

  function refresh() {
    $.getJSON(slice.jsonEndpoint(), function(payload) {
        let chart_options = getOptions(payload);
        let chart = echarts.init(document.getElementById(slice.containerId));
        chart.setOption(chart_options);
        slice.done(payload);
      })
      .fail(function(xhr) {
        slice.error(xhr.responseText, xhr);
      });
  }
  return {
    getOptions,
    render: refresh,
    resize: refresh,
  };
}

module.exports = Ec3BarLineWidget;
