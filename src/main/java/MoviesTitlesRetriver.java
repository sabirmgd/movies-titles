import pojo.Movie;
import pojo.MoviesResponse;
import util.Constants;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MoviesTitlesRetriver {

    private Client client;
    private  List<String> movieTitles = new ArrayList<String>();
    public MoviesTitlesRetriver(Client client) {
        this.client = client;
    }

    private  MoviesResponse getMovies(String title, int pageNumber) {

        return client
                .target(Constants.BASE_URL)
                .path(Constants.MOVIES_PATH)
                .queryParam(Constants.PARAM_TITLE, title)
                .queryParam(Constants.PARAM_PAGE, String.valueOf(pageNumber))
                .request(MediaType.APPLICATION_JSON)
                .get(MoviesResponse.class);
    }

    private  void appendMoviesList(List<Movie> movies) {

        for (Movie movie : movies) {
            movieTitles.add(movie.getTitle());

        }
    }

    public List<String> getMovieTitles (String title){

        MoviesResponse movies= getMovies(title,1);
        int numberOfPages = movies.getTotalPages();

        appendMoviesList(movies.getMovies());

        for (int i =2 ; i<=numberOfPages;i++) {
            movies= getMovies(title,i);
            appendMoviesList(movies.getMovies());
        }

        Collections.sort(movieTitles);
        return movieTitles;


    }
}
