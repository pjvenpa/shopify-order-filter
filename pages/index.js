import { Layout, Page, Card, AppProvider, Button, ResourceList,Filters, ChoiceList, DataTable, Link, Popover, OptionList } from '@shopify/polaris';

import translations from '@shopify/polaris/locales/en.json';
import Cookies from 'js-cookie';

class Index extends React.Component {


  config = { apiKey: API_KEY, shopOrigin: Cookies.get("shopOrigin"), forceRedirect: true };

  constructor(props) {
    super(props);
    this.state = { 
      orders: [],
      rowOrder: [],
      places: [],
      pickdate: [],
      LocSelected: [],
      DateSelected: [],
      filters: [],
      queryValue: "",
      appliedFilters: [],

      popoverLocActive: false,
      popoverDateActive: false
      };
  }

  togglePopoverLocActive = () => {
    const flg = this.state.popoverLocActive;
    this.setState( { popoverLocActive: !flg } );
 }

 togglePopoverDateActive = () => {
  const flg = this.state.popoverDateActive;
  this.setState( { popoverDateActive: !flg } );
 }

  LocActivator = (
    <Button onClick={this.togglePopoverLocActive} disclosure>
      Locations
    </Button>
  );

 

  DateActivator = (
    <Button onClick={this.togglePopoverDateActive} disclosure>
      Date
    </Button>
  );



  render() {
    return (
      <AppProvider i18n={translations}>
        <Page>
      <Card>
        <Card.Section>

        <Layout>
        <Layout.Section>

          <Popover
            active={this.state.popoverLocActive}
            activator={this.LocActivator}
            onClose={this.togglePopoverLocActive}
          >
            
            <OptionList
              title="Pickup Location"
              onChange={this.handlePickupLocChange}
              options={this.state.places}
              selected={this.state.LocSelected}
              allowMultiple
            />
          </Popover>
        </Layout.Section>
        <Layout.Section secondary>
         
       
       

        <Popover
            active={this.state.popoverDateActive}
            activator={this.DateActivator}
            onClose={this.togglePopoverDateActive}
          >
            <OptionList
              title="Pickup Date"
              onChange={this.handlePickupDateChange}
              options={this.state.pickdate}
              selected={this.state.DateSelected}
              allowMultiple
            />
          </Popover>
          </Layout.Section>
      </Layout>
       

               
        </Card.Section>
        <DataTable
          columnContentTypes={[
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'text',
            'text'
          ]}
          headings={[
            'Order',
            'Date',
            'Customer',
            'Order total',
            'Payment',
            'Fulfillment',
            'Items',
            "PLocation",
            "PDate"
          ]}
          rows={this.state.rowOrder}
        />
      </Card>
      </Page>
      </AppProvider>
    );
  }

 

  handleFiltersQueryChange = ( value ) => {
    this.setState( {queryValue: value} );
  }

  componentDidMount = () => {
    var fetchUrl = `/api/orders`;
    fetch(fetchUrl).then(response => response.json()).then(json => { 
      this.ApiResponse( "getorders", "orders", json, "GET"  );
    }).catch( (err) => {
        
    });

  }

  beforeCall = (_action, _type) => {

  }

  onClickSend = () => {
   
  }

  

  handlePickupLocChange = ( value ) => {
    let self = this;
    this.setState( { LocSelected : value }, () => {
      self.triggerFilter();
    } );
  }


  triggerFilter = () => {
    let locations = [],
    date = [],
    order = {},
    lineItem = {},
    rrOrd = [];
    for (var i = 0; i < this.state.orders.length; i++) {
      order = this.state.orders[i];
      let locationFlg = false,
          dateFlg = false,
           loc = "",
              dd = "";
      for (var j = 0; j < order.line_items.length; j++) {
        lineItem = order.line_items[j];
        for (var t = 0; t < lineItem.properties.length; t++) {
          if (lineItem.properties[t]["name"] == "Pickup Location" ) {
            if( this.state.LocSelected.indexOf(lineItem.properties[t]["value"]) != -1 ){
              locationFlg = true;
            }
            loc = lineItem.properties[t]["value"];
          }

          if (lineItem.properties[t]["name"] == "Pick a delivery date" ) {
              if( this.state.DateSelected.indexOf(lineItem.properties[t]["value"]) != -1 ){
                dateFlg = true;
              }
              dd = lineItem.properties[t]["value"];
          }
        }
      }

      for (var p = 0; p < order.note_attributes.length; p++) {
          if ( order.note_attributes[p]["name"] == "Place" ) {
            if( this.state.LocSelected.indexOf(order.note_attributes[p]["value"]) != -1 ){
              locationFlg = true;
            }
            loc = order.note_attributes[p]["value"];
          }

          if (order.note_attributes[p]["name"] == "Date" || order.note_attributes[p]["name"] == "date") {
            if( this.state.DateSelected.indexOf(order.note_attributes[p]["value"]) != -1 ){
            dateFlg = true;
            }
            dd = order.note_attributes[p]["value"];
          }
      }

      if( this.state.LocSelected.length == 0 ){
        locationFlg = true;
      }

      if( this.state.DateSelected.length == 0 ){
        dateFlg = true;
      }

      if( locationFlg &&  dateFlg ){
      rrOrd.push( [ <Link external={true} url={ "https://" + this.config.shopOrigin + "/admin/orders/" + order.id} key={order.id}>{order.name}</Link>,
                    order.created_at.split( "t" )[0], 
                    order.customer.first_name + " " + order.customer.last_name,  
                    order.presentment_currency + " " + order.total_price, 
                    order.financial_status, 
                    order.fulfillment_status == null ? "Unfulfilled" : order.fulfillment_status, 
                    order.line_items.length + "",
                    loc,
                    dd] );
      }

    }
    this.setState( { rowOrder: rrOrd } );
  } 

  handlePickupDateChange = (value) => {
    var self = this;
    this.setState( { DateSelected : value }, () => {
      self.triggerFilter();
    } );
  }

  ApiResponse = (_action, _ep, _data, _type) => {
    if( _action == "getorders" && _ep == "orders" ){
       if( typeof _data.data != "undefined" && typeof _data.data.orders != "undefined" ){
          this.setState( { orders: _data.data.orders }  ); 
          this.setDatas();
       }
    }
  }

  ApiError = (_action, _type, _error) => {

  }

  

  setDatas = () => {
    let locations = [],
        date = [],
        order = {},
        lineItem = {},
        rrOrd = [];
        for (var i = 0; i < this.state.orders.length; i++) {
          order = this.state.orders[i];
          let loc = "",
              dd = "";
          for (var j = 0; j < order.line_items.length; j++) {
            lineItem = order.line_items[j];
            for (var t = 0; t < lineItem.properties.length; t++) {
              if (lineItem.properties[t]["name"] == "Pickup Location" ) {
                if( locations.indexOf(lineItem.properties[t]["value"]) == -1){
                  locations.push(lineItem.properties[t]["value"]);
                }
                loc = lineItem.properties[t]["value"];
              }

              if (lineItem.properties[t]["name"] == "Pick a delivery date"  ) {
                if(date.indexOf(lineItem.properties[t]["value"]) == -1){
                 date.push(lineItem.properties[t]["value"]);
                }
                dd = lineItem.properties[t]["value"];
              }
            }
          }

          for (var p = 0; p < order.note_attributes.length; p++) {
              if ( order.note_attributes[p]["name"] == "Place" ) {
                if(locations.indexOf(order.note_attributes[p]["value"]) == -1){
                  locations.push(order.note_attributes[p]["value"]);
                }
                loc = order.note_attributes[p]["value"];
              }

              if (order.note_attributes[p]["name"] == "Date" || order.note_attributes[p]["name"] == "date" ) {
                if(date.indexOf(order.note_attributes[p]["value"]) == -1){
                  date.push(order.note_attributes[p]["value"]);
                }
                dd = order.note_attributes[p]["value"];
              }
          }
          rrOrd.push( [ <Link external={true} url={ "https://" + this.config.shopOrigin + "/admin/orders/" + order.id} key={order.id}>{order.name}</Link>,
                        order.created_at, 
                        order.customer.first_name + " " + order.customer.last_name,  
                        order.presentment_currency + " " + order.total_price, 
                        order.financial_status, 
                        order.fulfillment_status == null ? "Unfulfilled" : order.fulfillment_status, 
                        order.line_items.length + "",
                        loc,
                        dd] );

        }

        let optionLocal = [],
            optionDate  = [];
            for( var q = 0; q < locations.length; q++ ){
              optionLocal.push( {label: locations[q], value: locations[q]} );
            }

            for( var w = 0; w < date.length; w++ ){
              optionDate.push( {label: date[w], value: date[w]} );
            }
           
            this.setState( { places: optionLocal, pickdate: optionDate, rowOrder: rrOrd } );
          
  }

  handleDateRemove = () => {
    this.setState( {DateSelected: [] } );
  }

  handlelocationRemove = () => {
    this.setState( {LocSelected: [] } );
  }

  handleFiltersClearAll = () => {
    this.setState( {DateSelected: [], LocSelected: [], queryValue: "" } );
  }

  handleQueryValueRemove = () => {
    this.setState( { queryValue: "" } );
  }

}
export default Index;