Ext.onReady(function(){
    
    var sids = [];
    sids["1028"] = "Activities Auxiliary to Financial Intermediation";
    sids["1276"] = "Activities of Households as Employers of Domestic Staff";
    sids["1217"] = "Activities of Membership Organisations Not Elsewhere Classified";
    sids["203"] = "Agriculture, Hunting and Related Service Activities";
    sids["960"] = "Air Transport";
    sids["728"] = "Collection, Purification and Distribution of Water";
    sids["1073"] = "Computer and Related Activities";
    sids["731"] = "Construction";
    sids["1178"] = "Education";
    sids["718"] = "Electricity, Gas, Steam and Hot Water Supply";
    sids["243"] = "Extraction of Crude Petroleum and Natural Gas; Service Activities Incidental to Oil and Gas Extraction Excluding Surveying";
    sids["997"] = "Financial Intermediation, Except Insurance and Pension Funding";
    sids["229"] = "Fishing, Fish Farming and Related Service Activities";
    sids["225"] = "Forestry, Logging and Related Service Activities";
    sids["1194"] = "Health and Social Work";
    sids["904"] = "Hotels and Restaurants";
    sids["1019"] = "Insurance and Pension Funding, Except Compulsory Social Security";
    sids["932"] = "Land Transport; Transport Via Pipelines";
    sids["447"] = "Manufacture of Coke, Refined Petroleum Products and Nuclear Fuel";
    sids["561"] = "Manufacture of Fabricated Metal Products, Except Machinery and Equipment";
    sids["270"] = "Manufacture of Food Products and Beverages";
    sids["689"] = "Manufacture of Furniture; Manufacturing Not Elsewhere Classified";
    sids["585"] = "Manufacture of Machinery and Equipment Not Elsewhere Classified";
    sids["503"] = "Manufacture of Other Non-metallic Mineral Products";
    sids["675"] = "Manufacture of Other Transport Equipment";
    sids["491"] = "Manufacture of Rubber and Plastic Products";
    sids["338"] = "Manufacture of Textiles";
    sids["376"] = "Manufacture of Wearing Apparel; Dressing and Dyeing of Fur";
    sids["400"] = "Manufacture of Wood And Products of Wood And Cork, Except Furniture; Manufacture of Articles of Straw and Plaiting Materials";
    sids["1092"] = "Other Business Activities";
    sids["256"] = "Other Mining and Quarrying";
    sids["1267"] = "Other Service Activities";
    sids["991"] = "Post and Telecommunications";
    sids["1164"] = "Public Administration and Defence; Compulsory Social Security";
    sids["430"] = "Publishing, Printing and Reproduction of Recorded Media";
    sids["1037"] = "Real Estate Activities";
    sids["1227"] = "Recreational, Cultural and Sporting Activities";
    sids["713"] = "Recycling";
    sids["1048"] = "Renting of Machinery and Equipment Without Operator and of Personal and Household Goods";
    sids["1087"] = "Research and Development";
    sids["847"] = "Retail Trade, Except of Motor Vehicles and Motorcycles; Repair of Personal and Household Goods";
    sids["757"] = "Sale, Maintenance and Repair of Motor Vehicles and Motorcycles; Retail Sale of Automotive Fuel";
    sids["971"] = "Supporting And Auxiliary Transport Activities; Activities Of Travel Agencies";
    sids["393"] = "Tanning and Dressing of Leather; Manufacture of Handbags, Saddlery, Harness And Footwear";
    sids["1279"] = "Undifferentiated Goods Producing Activities of Private Households for Own Use";
    sids["951"] = "Water Transport";
    sids["770"] = "Wholesale Trade and Commission Trade, Except of Motor Vehicles and Motorcycles";

    var divisionOpts = [];

    for(var i in sids) {

        if(sids.hasOwnProperty(i)) {
            divisionOpts.push([i, sids[i]]);
        }
        

    }

    // simple array store
    var divisionStore = new Ext.data.ArrayStore({
        fields: ['id', 'name'],
        data : divisionOpts
    });
    var divisionCombo = new Ext.form.ComboBox({
        store: divisionStore,
        displayField:'name',
        typeAhead: true,
        mode: 'local',
        forceSelection: true,
        triggerAction: 'all',
        emptyText:'Select a division...',
        width: 250,
        fieldLabel: 'Division',
        name: 'division',
        valueField: 'id',
        hiddenName: 'divisionId',
        selectOnFocus:true
    });

    new Ext.Viewport({
        layout: 'border',
        items: [{
            region: 'north',
            html: '<h1 class="x-panel-header">Co-ordnance</h1>',
            autoHeight: true,
            border: false,
            margins: '0 0 5 0'
        }, {
            region: 'east',
            collapsible: true,
            title: 'Search',
            width: 400,
            xtype: 'form',
            bodyStyle: {
                padding: 10
            },
            items: [{
                xtype: 'textfield',
                name: 'region',
                fieldLabel: 'Region'
            },{
                xtype: 'checkboxgroup',
                fieldLabel: 'Status',
                columns: 1,
                defaultType: 'radio', // each item will be a radio button
                items: [
                    {boxLabel: 'All', name: 'status', inputValue: null, checked: true},
                    {boxLabel: 'Active', name: 'status', inputValue: 'Active'},
                    {boxLabel: 'Dissolved', name: 'status', inputValue: 'Dissolved'}
                ]
            },divisionCombo,
            {
                xtype: 'slider',
                width: 214,
                value:50,
                increment: 10,
                minValue: 0,
                maxValue: 100,
                fieldLabel: 'Date of closure'
            },{
                xtype: 'button',
                text: 'Update',
                listeners: {
                    click: function (btn) {

                        var form = btn.ownerCt;

                        var params = form.getForm().getValues();

                        for(var j=0, k=mkrs.length; j<k; j++) {
                            mkrs[j].setMap(null);
                        }

                        Ext.Ajax.request({
                            url: 'search.php',
                            method: 'GET',
                            params: params,
                            success: function (response) {

                                var data = Ext.util.JSON.decode(response.responseText);
                                var geocoder = new google.maps.Geocoder();

                                var activeIcon = 'http://google-maps-icons.googlecode.com/files/company.png';
                                var inactiveIcon = 'http://google-maps-icons.googlecode.com/files/explosion.png';

                                var bounds = new google.maps.LatLngBounds();
                                var resultsToGet = data.length;

                                for(var i=0, n=data.length; i<n; i++) {

                                    

                                        var company = data[i].company;

                                        if(params['status'] != "") {
                                            if(company.current_status != params['status']) {
                                                continue;
                                            }
                                        }

                                        if(! company.registered_address_in_full) {
                                            continue;
                                        }

                                        var callback = function (results, status) {

                                            --resultsToGet;

                                            if (status == google.maps.GeocoderStatus.OK) {
                                                var marker = new google.maps.Marker({
                                                    map: map,
                                                    position: results[0].geometry.location,
                                                    title: this.name,
                                                    animation: google.maps.Animation.DROP,
                                                    icon: this.current_status == 'Active' ? activeIcon : inactiveIcon
                                                });

                                                mkrs.push(marker);

                                                bounds.extend(results[0].geometry.location);
                                            }

                                            if(resultsToGet == 0) {
                                                map.fitBounds(bounds);
                                            }

                                        }.createDelegate(company);

                                        geocoder.geocode({
                                            address: company.registered_address_in_full
                                        }, callback);

                                    }

                                
                            }
                        })
                    }
                }
            }]
        },{
            region: 'center',
            id: 'map',
            style: {
                width: '100%',
                height: '100%'
            }
        }]
    });

    var latlng = new google.maps.LatLng(53.884916, -2.416992 );
        var myOptions = {
          zoom: 6,
          center: latlng,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"),
            myOptions);

            var mkrs = [];

});
