const $ = require('jquery');
require('../node_modules/echarts-2.2.7/dist/echarts-all.js');
const ec3barline = require('./ec3_barlinepie.js')

function Ec3MapWidget(slice) {
  function refresh() {
    //TODO is and extraFilters False?
    $.getJSON(slice.jsonEndpoint({ extraFilters: false }), function(payload) {
        const fd = payload.form_data;
        const selected_areas = fd.aiec3_map_default_area?JSON.parse(fd.aiec3_map_default_area):[];
        let chart_options = ec3barline(slice).getOptions(payload);
        if(!chart_options.series[0].data||chart_options.series[0].data.length==0){
          chart_options.series[0].data=[];
          selected_areas.map((iName)=>{
            let aData = {};
            aData.name = iName;
            aData.selected = true;
            chart_options.series[0].data.push(aData);
          });
        }else{
          chart_options.series.map((elem)=>{
            elem.data.map((dItem)=>{
              if($.inArray(dItem.name, selected_areas)>=0){
                dItem.selected=true;
              }
            })
          })
        }
        
        //regist the custom map type
        var ec3_map_type = fd.aiec3_map_type||'svg';
        var ec3_map_name = fd.aiec3_map_type_name||'customMapName';
        if (ec3_map_type === 'svg'){
          console.log('enter SVG....');
          echarts.util.mapData.params.params[ec3_map_name] = {
            getGeoJson: function(callback) {
              $.ajax({
                url: fd.aiec3_map_file,
                dataType: 'xml',
                type: "get",
                success: function(xml) {
                  callback(xml);
                }
              });
            }
          };
        } else if (ec3_map_type === 'json'){
          console.log('enter JSON....,ec3_map_type:'+ec3_map_type
            +",ec3_map_name:"+ec3_map_name);
          echarts.util.mapData.params.params[ec3_map_name] = {
            getGeoJson: function(callback) {
              $.getJSON(fd.aiec3_map_file,callback);
            }
          };
        }
        let chart = echarts.init(document.getElementById(slice.containerId));
        chart.setOption(chart_options);

        //TODO support multi series
        let c = 0;
        function showTip() {
          console.log('call showTip...');
          if(c==0){
            chart_options.series[0].data.map((item) => {
              item.selected = false;
            });
            chart.setOption(chart_options);
          }
          let areaName = chart_options.series[0].data[c].name;
          chart.component.tooltip.showTip({seriesIndex: 0, name: areaName});
          if (fd.aiec3_map_connected) {
            let vals = []
            vals.push(areaName);
            if (fd.aiec3_map_connect_field != ''){
              slice.setFilter(fd.aiec3_map_connect_field, vals);
            }
          }
          c = c + 1 >= chart_options.series[0].data.length ? 0 : c + 1;
        }

        if (fd.aiec3_map_interval > 0) {
          setInterval(showTip, fd.aiec3_map_interval*1000);
        } else if (fd.aiec3_map_connected){
          chart.on('click', function (param){
            console.log('click params: ' + JSON.stringify(param));
            let vals = []
            vals.push(param.name);
            if (fd.aiec3_map_connect_field != ''){
              slice.setFilter(fd.aiec3_map_connect_field, vals);
            }
          });
        }

        slice.done(payload);
      })
      .fail(function(xhr) {
        slice.error(xhr.responseText, xhr);
      });
  }
  return {
    render: refresh,
    resize: refresh,
  };
}

module.exports = Ec3MapWidget;
