// JS
const $ = require('jquery');
import d3 from 'd3';

import React from 'react';
import ReactDOM from 'react-dom';

import Select from 'react-select';
import '../stylesheets/react-select/select.less';

import './filter_box.css';
import { TIME_CHOICES } from './constants.js';

const propTypes = {
  origSelectedValues: React.PropTypes.object,
  filtersChoices: React.PropTypes.object,
  onChange: React.PropTypes.func,
  filterField: React.PropTypes.string,
  // showDateFilter: React.PropTypes.bool,
  interval: React.PropTypes.integer,
};

const defaultProps = {
  origSelectedValues: {},
  onChange: () => {},
  // showDateFilter: false,
};

class IntervalFreshBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedValues: props.origSelectedValues,
      index: 0,
    };
    this.timer = this.timer.bind(this)
  }
  
  componentDidMount(){

  }

  timer(){
    // console.log('start timer()...' + JSON.stringify(this.state));
    // console.log('this.state.selectedValues: ' + JSON.stringify(this.state.selectedValues));
    // console.log('this.state.index: ' + this.state.index);
    const data = this.props.filtersChoices[this.props.filterField];
    const index = (this.state.index + 1) >= data.length ? 0 : (this.state.index + 1);
    console.log('index: ' + index);
    this.setState({index: index});
    // console.log('this.state.index: ' + this.state.index);
    let vals = []
    vals.push(data[index].id)
    const selectedValues = Object.assign({}, this.state.selectedValues);
    selectedValues[this.props.filterField] = vals;
    this.setState({ selectedValues });
    this.props.onChange(this.props.filterField, vals);
    // console.log('data[index].text: ' + data[index].text);
  }

  componentWillMount(){
    let intervalId = setInterval(this.timer, this.props.interval*1000);
    // let _this = this;
    // var intervalId = setInterval(function(){
    //   console.log('start timer()...');
    //   console.log('this.state.selectedValues: ' + JSON.stringify(_this.state.selectedValues));
    //   console.log('this.state.index: ' + _this.state.index);
    // }, 5000);
    // store intervalId in the state so it can be accessed later:
    // this.setState({intervalId: intervalId});
  }

  render() {
    // console.log('this.props.filterField: ' + this.props.filterField);
    // console.log('this.props.filtersChoices: ' + JSON.stringify(this.props.filtersChoices));
    // console.log('this.state.selectedValues: ' + JSON.stringify(this.state.selectedValues));
    // console.log('this.state.index: ' + this.state.index);
    const data = this.props.filtersChoices[this.props.filterField];
    const filters = Object.keys(this.props.filtersChoices).map((filter) => {
      return (<span key={data[this.state.index]['id']}>{data[this.state.index]['text']}</span>)
    });
    return (
      <div>
        {filters}
      </div>
    );
  }

}
IntervalFreshBox.propTypes = propTypes;
IntervalFreshBox.defaultProps = defaultProps;

function filterBox(slice) {
  const d3token = d3.select(slice.selector);

  const refresh = function () {
    d3token.selectAll('*').remove();

    // filter box should ignore the dashboard's filters
    const url = slice.jsonEndpoint({ extraFilters: false });
    $.getJSON(url, (payload) => {
      const fd = payload.form_data;
      // Making sure the ordering of the fields matches the setting in the
      // dropdown as it may have been shuffled while serialized to json
      console.log('fd.filter_field: ' + fd.filter_field);
      console.log('keys...: ' + JSON.stringify(Object.keys(payload.data)));
      const filter_field = Object.keys(payload.data)[0];
      ReactDOM.render(
        <IntervalFreshBox
          filtersChoices={payload.data}
          onChange={slice.setFilter}
          // showDateFilter={fd.date_filter}
          origSelectedValues={slice.getFilters() || {}}
          filterField={filter_field}
          interval = {fd.airefresh_interval}
        />,
        document.getElementById(slice.containerId)
      );
      slice.done(payload);
    })
    .fail(function (xhr) {
      slice.error(xhr.responseText, xhr);
    });
  };
  return {
    render: refresh,
    resize: () => {},
  };
}

module.exports = filterBox;
