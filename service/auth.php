<?php 
date_default_timezone_set('Asia/Singapore');
header('Access-Control-Allow-Origin: *');
require_once ("Rest.inc.php");


class API extends REST
{

	private $ldapHost = "";
	private $ldapPort = null;
	private $ldapAdminGrp = "";
	private $ldapUserGrp1 = "";
	private $ldapUserGrp2 = "";
	private $ldapTree = "";
	private $domainName = "";
	private $apiSite = null;

	public $data = "";
	private $ldap = NULL;

	public function __construct($value1, $value2, $value3, $value4, $value5, $value6, $value7, $value8)
	{

		parent::__construct();	

			// Init parent contructor
		$this->ldapHost = $value1;
		$this->ldapPort = (int)$value2;
		$this->ldapAdminGrp = $value3;
		$this->ldapUserGrp1 = $value4;
		$this->ldapUserGrp2 = $value5;
		$this->ldapTree = $value6;
		$this->domainName = $value7;
		$this->apiSite = $value8;
	}
				
		/*
	 * Dynmically call the method based on the query string
	 */
	public function processApi()
	{
		$func = strtolower(trim(str_replace("/", "", $_REQUEST['x'])));
		if ((int)method_exists($this, $func) > 0)
			$this->$func();
		else
			$this->response('', 404); 
				// If the method not exist with in this class "Page not found".

	}

	private function getDataProvider()
	{
		if ($this->get_request_method() != "GET") {
			$this->response('', 406);
		}

		$tmpSite = array('API' => $this->apiSite);
		$this->response($this->json($tmpSite), 200); 
			// send user details    	

	}

	private function ldapConnect()
	{
		if ($this->get_request_method() != "GET") {
			$this->response('', 406);
		}

		$user = $this->_request['id'];
		$passwd = $this->_request['pwd'];
		$access = 0;
		$memberOf = "";
		$fullName = "";
		$entries = null;
		$result = null;
		$ldap = ldap_connect($this->ldapHost, $this->ldapPort);
		if ($ldap) {
				//echo("\n\n able to connect to ldap \n");
				//echo("\n domainName : ".$user.$this->domainName);
			if ($bind = @ldap_bind($ldap, $user . $this->domainName, $passwd)) {
				$filter = "(sAMAccountName=" . $user . ")";
				$attr = array("memberof", "givenname", "sn");
                    //$attr = array("memberof");           
					//echo("c ldapTree : ".$this->ldapTree);           
				$result = ldap_search($ldap, $this->ldapTree, $filter, $attr) or exit("Unable to search LDAP server");
				$entries = ldap_get_entries($ldap, $result);

				$fname = $entries[0]['givenname'][0];
				$lname = $entries[0]['sn'][0];

				if ($fname = "-") {
					$fullName = $lname;
				}
				else {
					$fullName = $lname . $fname;
				}

				foreach ($entries[0]['memberof'] as $grps) { 
						//echo("\n grps : ".$grps);
					$tmpCase = strtolower($grps);
					$tmpGrp = strtolower($this->ldapUserGrp1);
					if (strpos($tmpCase, $tmpGrp)) {
						$memberOf = $tmpGrp;
						$access = 1;
						break;
					}

					$tmpGrp = strtolower($this->ldapUserGrp2);
					if (strpos($tmpCase, $tmpGrp)) {
						$memberOf = $tmpGrp;
						$access = 2;
						break;
					}

					$tmpGrp = strtolower($this->ldapAdminGrp);
					if (strpos($tmpCase, $tmpGrp)) {
						$memberOf = $tmpGrp;
						$access = 3;
						break;
					}

				}
				ldap_unbind($ldap);
			}
		}

		$result = array('LongName' => $fullName, 'ShortName' => $user, 'ID' => $access, 'GrpMemberOf' => $memberOf, 'ServiceAPI' => $this->apiSite);
		$this->response($this->json($result), 200); // send user details        

	}

		/*
	 *	Encode array into JSON
	 */
	private function json($data)
	{
		if (is_array($data)) {
			return json_encode($data);
		}
	}
}

?>