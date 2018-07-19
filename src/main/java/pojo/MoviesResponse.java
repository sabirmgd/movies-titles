package pojo;

import pojo.Movie;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;


@XmlRootElement
public class MoviesResponse {


    @XmlElement(name="page")
    private int page;

    @XmlElement(name="per_page")
    private int perPage;

    @XmlElement(name="total")
    private int total;

    @XmlElement(name="total_pages")
    private int totalPages;


    @XmlElement(name="data")
    private List<Movie> movies;


    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPerPage() {
        return perPage;
    }

    public void setPerPage(int perPage) {
        this.perPage = perPage;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public List<Movie> getMovies() {
        return movies;
    }

    public void setMovies(List<Movie> movies) {
        this.movies = movies;
    }


    public MoviesResponse() {
    }

    public MoviesResponse(int page, int perPage, int total, int totalPages, List<Movie> movies) {
        this.page = page;
        this.perPage = perPage;
        this.total = total;
        this.totalPages = totalPages;
        this.movies = movies;
    }

    @Override
    public String toString() {
        return "pojo.MoviesResponse{" +
                "page=" + page +
                ", perPage=" + perPage +
                ", total=" + total +
                ", totalPages=" + totalPages +
                ", movies=" + movies +
                '}';
    }
}
