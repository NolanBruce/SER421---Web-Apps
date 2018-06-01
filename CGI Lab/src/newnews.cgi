#!/usr/bin/perl

use CGI;
use XML::LibXML;
use List::Util 1.33 'any';
use List::MoreUtils 'first_index';

#load articles from xml
my $artxml = "news.xml";
my $articles = XML::LibXML->load_xml(location => $artxml);
#load users form json
my $newsusers;
open(JSON,"newsusers.json")|| die "cannot open file";
while(<JSON>) { 
	$newsusers = $newsusers . $_; # echo line read
}
close(JSON);
#declare some global variables
my $buffer;
my @queries;
my $i;
my $cred;
#set user and role to guest by default
my $userName = 'guest';
my $role = 'guest';

#store POST STDIN if method is POST or store index of title in query if GET
if ($ENV{'REQUEST_METHOD'} eq "POST"){
	if (index($ENV{'PATH_INFO'}, "ADD") == -1) {
		read(STDIN, $buffer, $ENV{'CONTENT_LENGTH'});
		$buffer = "?" . $buffer;
		print CGI->redirect("$buffer");
	} elsif (index($ENV{'PATH_INFO'}, "ADD") != -1) {
		
	}
} else {
	$buffer = $ENV{'QUERY_STRING'};
	@queries = split(/&/, $buffer);
	if (any{/title/} @queries) {
		$i = first_index{/title/} @queries;
	}
}

print "Content-type:text/html\r\n\r\n";
print '<html>';

print '<head>';
print '<title>NEW News Inc.</title>';
print '</head>';

print '<body>';


#check if user is logged in and store userName if so
if (any{/userName/} @queries) {
	my $j = first_index{/userName/} @queries;
	$userName = @queries[$j];
	$userName =~ s/\%20/ /g;
	$userName =~ s/userName//g;
	$userName =~ s/\=//g;
}
#store user's role
if (any{/role/} @queries) {
		my $j = first_index{/role/} @queries;
		$role = @queries[$j];
		$role =~ s/\%20/ /g;
		$role =~ s/role//g;
		$role =~ s/\=//g;
	}

#Welcome user by userName or generic 'user' if not logged in
print '<h2>Welcome, ' . $userName . '.';
if ($role ne "guest") {
	print ' You are logged in as a ' . $role;
}
print '</h2>';

#put login or logout button at top of page
if ($role ne "guest") {
	print '<form method ="GET" action="./">';
	print '<input type="submit" value="Logout">';
	print '</form>';
} elsif ($ENV{'PATH_INFO'} eq "/LOGIN") {
	#intentionally left blank
} else {
	print '<form method ="GET" action="LOGIN">';
	print '<input type="submit" value="Login">';
	print '</form>';
}

#if on LOGIN page, print login form
if ($ENV{'PATH_INFO'} eq "/LOGIN"){
	backButton();

	print '<form action="./" method ="POST">';
	print 'User Name:' . '<br>';
	print '<input type="text" name="userName" cols="50" required>' . '<br>';
	print 'User Role:' . '<br>';
	print 'Subscriber';
	print '<input type="radio" name="role" value="Subscriber" checked>' . '<br>';
	print 'Reporter';
	print '<input type="radio" name="role" value="Reporter">' . '<br>';
	print '<input type="submit" value="Submit">';
	print '</form>';
} elsif (defined $i) {
	#If title is in QUERY_STRING , get article and print content
	backButton();
	printArticle(@queries[$i]);
} elsif (index($ENV{'PATH_INFO'}, "WRITE") != -1) {
	#If WRITE action was called, present form for article creation
	backButton();
	print '<form action="ADD" method ="POST">';
	print '<input type="hidden" name="userName" value=' . $userName . '>';
	print '<input type="hidden" name="role" value=' . $role . '>';
	print '<form action method="POST">';
	print 'Title: ';
	print '<input type="text" name="title" cols="75" required>';
	print 'Article Visibility: ' . '<br>';
	print 'Private' . '<input type="radio" name="visibility" value="T">';
	print 'Public' . '<input type="radio" name="visibility" value="F" checked>' . '<br>';
	print '<textarea name="content" rows="25" cols="100" required>';
	print '</textarea>' . '<br>';
	print '<input type="submit" value="Submit">';
	print '</form>';
	#to do: figure out why this page is generating an extra %2522 at the end of the userName
	#to do: create method for handling articles created/edited by ADD action
} else {
	#otherwise print collection of articles
	#FirstGet userName and role
	if (any{/userName/} @queries) {
		my $j = first_index{/userName/} @queries;
		$userName = @queries[$j];
		$userName =~ s/\%20/ /g;
		$userName =~ s/userName//g;
		$userName =~ s/\=//g;
	}
	if (any{/role/} @queries) {
		my $j = first_index{/role/} @queries;
		$role = @queries[$j];
		$role =~ s/\%20/ /g;
		$role =~ s/role//g;
		$role =~ s/\=//g;
	}
	#Print form for creating new article if user logged in is a Reporter
	if ($role eq "Reporter") {
		print '<form method ="GET" action="WRITE">';
		print '<input type="hidden" name="userName" value=' . $userName . '>';
		print '<input type="hidden" name="role" value=' . $role . '>';
		print '<input type="submit" value="Create Article">';
		print '</form>';
	}
	#Print articles
	foreach my $article ($articles->findnodes('/NEWS/ARTICLE')) {
		my $title = $article->findnodes('./TITLE')->to_literal();
		#if article is public, print with link no matter what
		if ($article->findnodes('./PUBLIC')->to_literal() eq "T") {
		    printLink($title->to_literal());
	    } elsif ($article->findnodes('./AUTHOR')->to_literal() eq $userName) {
	    	#print a link for all articles by signed in reporter
	    	#to do: add edit and delete button for these articles
	    	printLink($title->to_literal());
		} elsif ($role eq 'Subscriber') {
			#print a link for all articles for subscribers
			printLink($title->to_literal());
		} else {
			#otherwise, only print title
			print $title->to_literal() . '<br/>';
		}
	}
}

print '</body>';
print '</html>';

#Prints the contents of an article
sub printArticle() {
	my ($title) = @_;
	my $found = false;
	#parse title
	$title =~ s/\%20/ /g;
	$title =~ s/title//g;
	$title =~ s/\=//g;
	#search for title
	foreach my $article ($articles->findnodes('/NEWS/ARTICLE')) {
	    if ($article->findnodes('./TITLE')->to_literal() eq $title) {
	    	print $article->findnodes('./CONTENT') . '<br/>';
	    	$found = true;
	    	break;
	    }
	}
	#if not found, inform user
	if ($found eq false) {
		print 'No article found with title "' . $title . '" <br/>';
	}
}

#Prints link to article
sub printLink {
	my ($title) = @_;
	print '<a href="?title=' . $title . '&userName=' . $userName . '&role=' . $role . '">' . $title . '</a>' . '<br/>';
}

#Creates a back button
sub backButton() {
	print '<form method ="GET" action="./">';
	#add hidden forms to maintain session if user is logged in
	if ($role ne "guest") {
		print '<input type="hidden" name="userName" value=' . $userName . '>';
		print '<input type="hidden" name="role" value=' . $role . '>';
	}
	print '<input type="submit" value="Back">';
	print '</form>';
}

1;