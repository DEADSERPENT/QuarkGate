package org.acme.productservice.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class ProductEntity extends PanacheEntity {

    public String name;
    public String description;
    public BigDecimal price;
    public Integer stockQuantity;
    public String category;
}
