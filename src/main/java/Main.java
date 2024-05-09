import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import java.util.List;


public class Main {

    public static void main(String[] args) {
        // the HTTP client
        Client client = ClientBuilder.newClient();


        // the movie title can be passed as an argument, if no argument is passed, spiderman will be passed
        String title = "";
        if (args.length > 0)  title =args[0];
        else title="spiderman";
        else title="panda";
        MoviesTitlesRetriver mr = new MoviesTitlesRetriver(client);

        List<String> movieTitles = mr.getMovieTitles(title);

        System.out.println(movieTitles);
        System.out.println(movieTitles);

        System.out.prin(movieTitles);
    }
    }

