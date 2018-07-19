import pojo.Movie;
import pojo.MoviesResponse;
import util.Constants;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


public class Main {





    public static void main(String[] args) {

        Client client = ClientBuilder.newClient();


        String title = "";
        if (args.length > 0)  title =args[0];
        else title="spiderman";


        MoviesTitlesRetriver mr = new MoviesTitlesRetriver(client);

        List<String> movieTitles = mr.getMovieTitles(title);

        System.out.println(movieTitles);



    }
    }

