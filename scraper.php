<?php

set_time_limit(0);
ini_set('max_execution_time', 0);

include('db.php');

class OCIndexScraper {


    function __construct($db, $sicDivisionId = 731, $juristiction = 'uk'){
        $this->db = $db;
      $this->companies = array();
      $this->domain = 'http://opencorporates.com';
        $urlFormat = '%s/search?jurisdiction_code=%s&sic_division_ids=%d';
       $this->url = sprintf($urlFormat,$this->domain,$juristiction,$sicDivisionId);
       $this->pageCount = 1;
       $this->sicDivisionId = $sicDivisionId;
       //var_dump($this->url)
       $this->openTask($this->url);;
       $this->getPageData();
    }

    function getPageData(){
        $this->html = file_get_contents($this->url);

        $this->parseForLinks();
    }

    private function parseForLinks(){


       $nextPage = (string) ++$this->pageCount;

        $dom = new DOMDocument();
        $dom->loadHTML($this->html);
        $xpath = new DOMXPath($dom);
        $hrefs = $xpath->evaluate("/html/body//a");
        $companies = array();

        for ($i = 0; $i < $hrefs->length; $i++) {
            $href = $hrefs->item($i);
            $url = $href->getAttribute('href');
            //var_dump($url);
            if (strpos($url,'http://opencorporates.com/companies/uk')!== FALSE){
                $companies[] = $url.'.json';
                //echo 'Added company<br />';
            }
            elseif (strpos($url,'page='.$nextPage)){
                $nextPageUrl = $this->domain.$url;
                //echo 'Doing next page - '.count($companies).' so far<br/>';
            }
        }
        
        $this->getCompanyData($companies);
        $companies = array();

        if ($nextPageUrl){
            
            $this->url = $nextPageUrl;
            $this->getPageData();

        }else{

            $this->closeTask();


        }


    }

    function openTask($url) {
        mysqli_query($this->db, 'INSERT INTO searches (url, scraped) VALUES ("' . $this->url . '", 0)');
        $this->taskId = mysqli_insert_id($this->db);
    }

    function closeTask() {
        mysqli_query($this->db, 'UPDATE searches SET scraped = 0 WHERE id = ' . $this->taskId);
    }

    function getCompanyData($companies) {

        $return = array();

        foreach($companies as $companyUrl) {

            $companyId = array_pop(array_slice(explode('.', basename($companyUrl)), 0, 1));

            // Do we have this company already?
            $result = mysqli_query(
                $this->db,
                'SELECT id FROM companies WHERE companyId = "' . $companyId . '"',
                MYSQLI_ASSOC
            );
            
            if($result instanceof mysqli_result && $result->num_rows > 0) {
                continue;
            }

            // Get it

            $jsonStr = file_get_contents($companyUrl);

            if(! $jsonStr) {
                continue;
            }

            $json = json_decode($jsonStr);
            
            if(! is_object($json)) {
                continue;
            }

            $address = $json->company->registered_address_in_full;
            if(! $address) {
                continue;;
            }

            $postcodeArray = $this->getPostcodeArray($address);
            $sector = $postcodeArray[0];
            $area = $postcodeArray[1];

            $name = $json->company->name;
            $divisionId = $this->sicDivisionId;
            $data = $jsonStr;

            $query = "INSERT INTO companies (companyId, divisionId, sector, area, name, data) VALUES ('$companyId', '$divisionId', '$sector', '$area', '$name', '$data')";
            mysqli_query($this->db, $query);

        }

    }

    function getPostcodeArray($address) {

        $a = explode(',', $address);

        $pc = array_pop($a);

        $pc = explode(' ', trim($pc));

        return $pc;

    }


}

$scraper = new OCIndexScraper($db, $_GET['divisionId']);